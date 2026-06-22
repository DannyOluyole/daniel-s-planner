package com.clarity.app.blocking

import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.ParcelFileDescriptor
import org.json.JSONArray
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer

/**
 * DNS-only local VPN: only DNS queries (port 53) are routed through the tun
 * interface (via addDnsServer pointing at the tun's own address, with no
 * default route). Blocked hostnames get a synthesized NXDOMAIN response;
 * everything else is forwarded to a real upstream resolver and the real
 * response is relayed back. All other device traffic is untouched.
 *
 * Start via: startService(Intent(this, ClarityVpnService::class.java).setAction("START"))
 * Stop via:  startService(Intent(this, ClarityVpnService::class.java).setAction("STOP"))
 */
class ClarityVpnService : VpnService() {

    companion object {
        private const val TUN_ADDRESS = "10.0.0.2"
        private const val UPSTREAM_DNS = "8.8.8.8"
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private lateinit var prefs: SharedPreferences
    private var running = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        prefs = getSharedPreferences("clarity_blocking", MODE_PRIVATE)

        when (intent?.action) {
            "START" -> startVpn()
            "STOP"  -> stopVpn()
        }
        return START_STICKY
    }

    private fun startVpn() {
        if (running) return
        vpnInterface = Builder()
            .addAddress(TUN_ADDRESS, 32)
            .addDnsServer(TUN_ADDRESS)
            .setSession("Clarity")
            .establish()

        running = true
        Thread { runPacketLoop() }.start()
    }

    private fun stopVpn() {
        running = false
        vpnInterface?.close()
        vpnInterface = null
        stopSelf()
    }

    private fun runPacketLoop() {
        val vpnFd = vpnInterface ?: return
        val inputStream  = FileInputStream(vpnFd.fileDescriptor)
        val outputStream = FileOutputStream(vpnFd.fileDescriptor)
        val packet = ByteBuffer.allocate(32767)

        while (running) {
            packet.clear()
            val length = inputStream.read(packet.array())
            if (length <= 0) continue
            packet.limit(length)

            val dns = parseDnsQuery(packet) ?: continue
            val hostname = dns.hostname

            val responsePayload = if (shouldBlock(hostname)) {
                buildNxDomainResponse(dns.dnsPayload)
            } else {
                forwardToUpstream(dns.dnsPayload) ?: continue
            }

            val responsePacket = buildIpv4UdpPacket(
                srcIp = TUN_ADDRESS, srcPort = 53,
                dstIp = dns.srcIp, dstPort = dns.srcPort,
                payload = responsePayload,
            )
            outputStream.write(responsePacket)
        }
    }

    private fun shouldBlock(hostname: String): Boolean {
        val blockedDomains = loadStringSet("blocked_domains")
        val keywords       = loadStringSet("blocked_keywords")

        if (blockedDomains.any { hostname == it || hostname.endsWith(".$it") }) return true
        if (keywords.any { hostname.contains(it, ignoreCase = true) }) return true

        return false
    }

    private fun forwardToUpstream(dnsQuery: ByteArray): ByteArray? {
        return try {
            val socket = DatagramSocket()
            protect(socket)
            socket.soTimeout = 5000

            val upstreamAddr = InetAddress.getByName(UPSTREAM_DNS)
            val outPacket = DatagramPacket(dnsQuery, dnsQuery.size, upstreamAddr, 53)
            socket.send(outPacket)

            val buf = ByteArray(512)
            val inPacket = DatagramPacket(buf, buf.size)
            socket.receive(inPacket)
            socket.close()

            buf.copyOf(inPacket.length)
        } catch (_: Exception) { null }
    }

    private fun buildNxDomainResponse(query: ByteArray): ByteArray {
        val response = query.copyOf()
        response[2] = 0x81.toByte()  // QR=1 (response), keep RD
        response[3] = 0x83.toByte()  // RCODE=3 (NXDOMAIN)
        // ANCOUNT, NSCOUNT, ARCOUNT = 0
        response[6] = 0; response[7] = 0
        response[8] = 0; response[9] = 0
        response[10] = 0; response[11] = 0
        return response
    }

    private data class DnsQuery(
        val srcIp: String,
        val srcPort: Int,
        val hostname: String,
        val dnsPayload: ByteArray,
    )

    private fun parseDnsQuery(packet: ByteBuffer): DnsQuery? {
        return try {
            val ipVersion = (packet.get(0).toInt() shr 4) and 0xF
            if (ipVersion != 4) return null
            val protocol = packet.get(9).toInt() and 0xFF
            if (protocol != 17) return null

            val ipHeaderLen = (packet.get(0).toInt() and 0xF) * 4
            val srcIp = "${packet.get(12).toInt() and 0xFF}.${packet.get(13).toInt() and 0xFF}." +
                "${packet.get(14).toInt() and 0xFF}.${packet.get(15).toInt() and 0xFF}"

            val srcPort = ((packet.get(ipHeaderLen).toInt() and 0xFF) shl 8) or
                (packet.get(ipHeaderLen + 1).toInt() and 0xFF)
            val destPort = ((packet.get(ipHeaderLen + 2).toInt() and 0xFF) shl 8) or
                (packet.get(ipHeaderLen + 3).toInt() and 0xFF)
            if (destPort != 53) return null

            val udpLen = ((packet.get(ipHeaderLen + 4).toInt() and 0xFF) shl 8) or
                (packet.get(ipHeaderLen + 5).toInt() and 0xFF)
            val dnsOffset = ipHeaderLen + 8
            val dnsLen = udpLen - 8
            if (dnsLen <= 0 || dnsOffset + dnsLen > packet.limit()) return null

            val dnsPayload = ByteArray(dnsLen)
            for (i in 0 until dnsLen) dnsPayload[i] = packet.get(dnsOffset + i)

            val hostname = extractHostname(dnsPayload) ?: return null
            DnsQuery(srcIp, srcPort, hostname, dnsPayload)
        } catch (_: Exception) { null }
    }

    private fun extractHostname(dnsPayload: ByteArray): String? {
        return try {
            val sb = StringBuilder()
            var i = 12 // skip DNS header
            while (i < dnsPayload.size) {
                val len = dnsPayload[i].toInt() and 0xFF
                if (len == 0) break
                if (sb.isNotEmpty()) sb.append('.')
                for (j in 0 until len) sb.append((dnsPayload[i + 1 + j].toInt() and 0xFF).toChar())
                i += len + 1
            }
            sb.toString().ifEmpty { null }
        } catch (_: Exception) { null }
    }

    private fun buildIpv4UdpPacket(
        srcIp: String, srcPort: Int, dstIp: String, dstPort: Int, payload: ByteArray,
    ): ByteArray {
        val udpLen = 8 + payload.size
        val totalLen = 20 + udpLen
        val buf = ByteArray(totalLen)

        // IPv4 header
        buf[0] = 0x45.toByte()        // version 4, header length 20 bytes
        buf[1] = 0                    // TOS
        writeUInt16(buf, 2, totalLen)
        writeUInt16(buf, 4, 0)        // identification
        writeUInt16(buf, 6, 0)        // flags/fragment offset
        buf[8] = 64.toByte()          // TTL
        buf[9] = 17                   // protocol = UDP
        writeUInt16(buf, 10, 0)       // checksum placeholder

        val src = srcIp.split(".").map { it.toInt() }
        val dst = dstIp.split(".").map { it.toInt() }
        for (i in 0 until 4) buf[12 + i] = src[i].toByte()
        for (i in 0 until 4) buf[16 + i] = dst[i].toByte()

        val ipChecksum = computeChecksum(buf, 0, 20)
        writeUInt16(buf, 10, ipChecksum)

        // UDP header
        writeUInt16(buf, 20, srcPort)
        writeUInt16(buf, 22, dstPort)
        writeUInt16(buf, 24, udpLen)
        writeUInt16(buf, 26, 0) // checksum optional for IPv4, 0 = unused

        System.arraycopy(payload, 0, buf, 28, payload.size)

        return buf
    }

    private fun writeUInt16(buf: ByteArray, offset: Int, value: Int) {
        buf[offset] = ((value shr 8) and 0xFF).toByte()
        buf[offset + 1] = (value and 0xFF).toByte()
    }

    private fun computeChecksum(buf: ByteArray, offset: Int, length: Int): Int {
        var sum = 0L
        var i = offset
        while (i < offset + length) {
            val word = ((buf[i].toInt() and 0xFF) shl 8) or
                (if (i + 1 < offset + length) (buf[i + 1].toInt() and 0xFF) else 0)
            sum += word
            i += 2
        }
        while (sum shr 16 != 0L) sum = (sum and 0xFFFF) + (sum shr 16)
        return (sum.inv() and 0xFFFF).toInt()
    }

    private fun loadStringSet(key: String): Set<String> {
        val json = prefs.getString(key, "[]") ?: "[]"
        val arr  = JSONArray(json)
        return (0 until arr.length()).map { arr.getString(it) }.toSet()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}
