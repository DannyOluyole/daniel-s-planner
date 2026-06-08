package com.example.clarity.blocking

import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.ParcelFileDescriptor
import org.json.JSONArray
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetAddress
import java.nio.ByteBuffer

/**
 * Local VPN that intercepts DNS queries (port 53) and returns NXDOMAIN
 * for blocked domains and keyword-matched hostnames.
 *
 * Architecture:
 *   All device traffic → tun0 interface (this VPN) → inspect DNS → forward/drop
 *
 * Start via: startService(Intent(this, ClarityVpnService::class.java).setAction("START"))
 * Stop via:  startService(Intent(this, ClarityVpnService::class.java).setAction("STOP"))
 */
class ClarityVpnService : VpnService() {

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
        vpnInterface = Builder()
            .addAddress("10.0.0.2", 32)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("8.8.8.8")
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

    /**
     * Reads raw IP packets from the tun interface.
     * Parses DNS queries (UDP port 53) and drops packets for blocked hostnames.
     * All other packets are forwarded transparently via the real network.
     *
     * NOTE: This is a skeleton — a production implementation needs a full
     * DNS proxy (e.g. using dnsjava or pcap4j) to correctly rewrite responses.
     * The structure here shows the integration point.
     */
    private fun runPacketLoop() {
        val vpnFd    = vpnInterface ?: return
        val inputStream  = FileInputStream(vpnFd.fileDescriptor)
        val outputStream = FileOutputStream(vpnFd.fileDescriptor)
        val packet   = ByteBuffer.allocate(32767)

        while (running) {
            packet.clear()
            val length = inputStream.read(packet.array())
            if (length <= 0) continue

            packet.limit(length)

            val hostname = extractDnsHostname(packet)
            if (hostname != null && shouldBlock(hostname)) {
                // Drop the packet — no response sent → DNS query times out → site unreachable
                continue
            }

            // Forward packet unchanged
            outputStream.write(packet.array(), 0, length)
        }
    }

    private fun shouldBlock(hostname: String): Boolean {
        val blockedDomains = loadStringSet("blocked_domains")
        val keywords       = loadStringSet("blocked_keywords")

        // Exact domain match
        if (blockedDomains.any { hostname == it || hostname.endsWith(".$it") }) return true

        // Keyword match in hostname
        if (keywords.any { hostname.contains(it, ignoreCase = true) }) return true

        return false
    }

    /**
     * Extracts the DNS query hostname from a raw IP packet.
     * Returns null if the packet isn't a DNS query.
     */
    private fun extractDnsHostname(packet: ByteBuffer): String? {
        return try {
            val ipVersion = (packet.get(0).toInt() shr 4) and 0xF
            if (ipVersion != 4) return null                  // IPv4 only for now
            val protocol  = packet.get(9).toInt() and 0xFF
            if (protocol != 17) return null                  // UDP only
            val ipHeaderLen = (packet.get(0).toInt() and 0xF) * 4
            val destPort = ((packet.get(ipHeaderLen + 2).toInt() and 0xFF) shl 8) or
                            (packet.get(ipHeaderLen + 3).toInt() and 0xFF)
            if (destPort != 53) return null                  // DNS only

            // DNS payload starts at ipHeaderLen + 8 (UDP header is 8 bytes)
            val dnsOffset = ipHeaderLen + 8 + 12             // skip DNS header (12 bytes)
            val sb = StringBuilder()
            var i  = dnsOffset
            while (i < packet.limit()) {
                val len = packet.get(i).toInt() and 0xFF
                if (len == 0) break
                if (sb.isNotEmpty()) sb.append('.')
                repeat(len) { sb.append(packet.get(i + 1 + it).toInt().toChar()) }
                i += len + 1
            }
            sb.toString().ifEmpty { null }
        } catch (_: Exception) { null }
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
