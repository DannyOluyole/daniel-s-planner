package com.screenguard.app.plugins;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import com.screenguard.app.MainActivity;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * DNS-intercept VPN service that blocks domains by returning 0.0.0.0
 * for DNS queries matching the block list.
 *
 * Architecture:
 *  - Creates a TUN interface that captures all device traffic
 *  - Intercepts UDP packets on port 53 (DNS)
 *  - For blocked domains, responds with NXDOMAIN / 0.0.0.0
 *  - All other traffic is forwarded to real DNS (8.8.8.8)
 */
public class ScreenGuardVpnService extends VpnService {

    private static final String TAG = "ScreenGuardVPN";
    public static final String ACTION_START = "com.screenguard.START_VPN";
    public static final String ACTION_STOP  = "com.screenguard.STOP_VPN";

    private static final String CHANNEL_ID = "screenguard_vpn";
    private static final int NOTIF_ID = 1;

    private static final Set<String> blockedDomains = new HashSet<>();
    private static boolean running = false;

    private ParcelFileDescriptor vpnInterface;
    private Thread vpnThread;

    // ── Static API called from BlockerPlugin ──────────────────────────────
    public static void setBlockedDomains(List<String> domains) {
        synchronized (blockedDomains) {
            blockedDomains.clear();
            for (String d : domains) {
                blockedDomains.add(d.toLowerCase().trim());
                blockedDomains.add("www." + d.toLowerCase().trim());
            }
        }
    }

    public static boolean isRunning() { return running; }

    // ── Service lifecycle ─────────────────────────────────────────────────
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopVpn();
            stopSelf();
            return START_NOT_STICKY;
        }
        startForegroundNotification();
        startVpn();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    // ── VPN setup ─────────────────────────────────────────────────────────
    private void startVpn() {
        try {
            Builder builder = new Builder();
            builder.setSession("ScreenGuard")
                   .addAddress("10.0.0.2", 32)
                   .addRoute("0.0.0.0", 0)
                   .addDnsServer("8.8.8.8")
                   .setMtu(1500);

            vpnInterface = builder.establish();
            if (vpnInterface == null) {
                Log.e(TAG, "VPN interface could not be established");
                return;
            }

            running = true;
            vpnThread = new Thread(this::runPacketLoop, "ScreenGuardVPN");
            vpnThread.start();
            Log.i(TAG, "VPN started, blocking " + blockedDomains.size() + " domains");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start VPN", e);
        }
    }

    private void stopVpn() {
        running = false;
        if (vpnThread != null) vpnThread.interrupt();
        try { if (vpnInterface != null) vpnInterface.close(); } catch (Exception ignored) {}
        vpnInterface = null;
        Log.i(TAG, "VPN stopped");
    }

    // ── Packet processing loop ────────────────────────────────────────────
    private void runPacketLoop() {
        FileInputStream in = new FileInputStream(vpnInterface.getFileDescriptor());
        FileOutputStream out = new FileOutputStream(vpnInterface.getFileDescriptor());
        ByteBuffer packet = ByteBuffer.allocate(32767);

        try (DatagramSocket dnsSocket = new DatagramSocket()) {
            protect(dnsSocket);

            while (running && !Thread.interrupted()) {
                packet.clear();
                int len = in.read(packet.array());
                if (len <= 0) continue;
                packet.limit(len);

                // Check if this is a UDP packet to port 53 (DNS)
                if (!isUdpDnsPacket(packet.array(), len)) {
                    // Pass through non-DNS packets unchanged
                    out.write(packet.array(), 0, len);
                    continue;
                }

                String queriedDomain = extractDnsQueryDomain(packet.array(), len);
                if (queriedDomain != null && isBlocked(queriedDomain)) {
                    // Respond with NXDOMAIN (blocked)
                    byte[] nxResponse = buildNxDomainResponse(packet.array(), len);
                    if (nxResponse != null) {
                        out.write(buildIpUdpResponse(packet.array(), nxResponse));
                    }
                    Log.d(TAG, "Blocked: " + queriedDomain);
                } else {
                    // Forward to real DNS and relay response
                    byte[] dnsPayload = extractUdpPayload(packet.array(), len);
                    if (dnsPayload != null) {
                        byte[] response = forwardDns(dnsSocket, dnsPayload);
                        if (response != null) {
                            out.write(buildIpUdpResponse(packet.array(), response));
                        }
                    }
                }
            }
        } catch (Exception e) {
            if (running) Log.e(TAG, "Packet loop error", e);
        }
    }

    private boolean isBlocked(String domain) {
        domain = domain.toLowerCase();
        synchronized (blockedDomains) {
            if (blockedDomains.contains(domain)) return true;
            // Check if it's a subdomain of a blocked domain
            for (String blocked : blockedDomains) {
                if (domain.endsWith("." + blocked)) return true;
            }
        }
        return false;
    }

    // ── DNS parsing helpers ───────────────────────────────────────────────
    private boolean isUdpDnsPacket(byte[] data, int len) {
        if (len < 28) return false;
        int protocol = data[9] & 0xFF;      // IP protocol field
        if (protocol != 17) return false;   // 17 = UDP
        int dstPort = ((data[22] & 0xFF) << 8) | (data[23] & 0xFF);
        return dstPort == 53;
    }

    private String extractDnsQueryDomain(byte[] data, int len) {
        try {
            int ipHeaderLen = (data[0] & 0x0F) * 4;
            int dnsOffset = ipHeaderLen + 8; // skip IP + UDP header (8 bytes)
            if (dnsOffset + 12 >= len) return null;

            // DNS header is 12 bytes, then the question section
            int pos = dnsOffset + 12;
            StringBuilder domain = new StringBuilder();
            while (pos < len) {
                int labelLen = data[pos] & 0xFF;
                if (labelLen == 0) break;
                if (domain.length() > 0) domain.append('.');
                pos++;
                if (pos + labelLen > len) break;
                domain.append(new String(data, pos, labelLen));
                pos += labelLen;
            }
            return domain.length() > 0 ? domain.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] extractUdpPayload(byte[] data, int len) {
        int ipHeaderLen = (data[0] & 0x0F) * 4;
        int udpHeaderLen = 8;
        int payloadOffset = ipHeaderLen + udpHeaderLen;
        if (payloadOffset >= len) return null;
        byte[] payload = new byte[len - payloadOffset];
        System.arraycopy(data, payloadOffset, payload, 0, payload.length);
        return payload;
    }

    private byte[] buildNxDomainResponse(byte[] request, int len) {
        try {
            byte[] dnsPayload = extractUdpPayload(request, len);
            if (dnsPayload == null || dnsPayload.length < 2) return null;
            // Copy the query, set QR=1 (response), RCODE=3 (NXDOMAIN)
            byte[] response = dnsPayload.clone();
            response[2] = (byte) 0x81; // QR=1, OPCODE=0, AA=0, TC=0, RD=1
            response[3] = (byte) 0x83; // RA=1, RCODE=3 (NXDOMAIN)
            return response;
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] forwardDns(DatagramSocket socket, byte[] query) {
        try {
            InetAddress dnsServer = InetAddress.getByName("8.8.8.8");
            DatagramPacket sendPkt = new DatagramPacket(query, query.length, dnsServer, 53);
            socket.send(sendPkt);

            byte[] buf = new byte[4096];
            DatagramPacket recvPkt = new DatagramPacket(buf, buf.length);
            socket.setSoTimeout(3000);
            socket.receive(recvPkt);

            byte[] response = new byte[recvPkt.getLength()];
            System.arraycopy(buf, 0, response, 0, recvPkt.getLength());
            return response;
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] buildIpUdpResponse(byte[] originalRequest, byte[] dnsPayload) {
        int ipHeaderLen = (originalRequest[0] & 0x0F) * 4;
        int totalLen = 20 + 8 + dnsPayload.length; // IP(20) + UDP(8) + DNS payload
        byte[] packet = new byte[totalLen];

        // IP header
        packet[0] = 0x45; // Version 4, IHL 5
        packet[1] = 0;
        packet[2] = (byte) ((totalLen >> 8) & 0xFF);
        packet[3] = (byte) (totalLen & 0xFF);
        packet[4] = originalRequest[4]; packet[5] = originalRequest[5]; // ID
        packet[6] = 0x40; packet[7] = 0; // Don't fragment
        packet[8] = 64; // TTL
        packet[9] = 17; // Protocol: UDP
        // Swap src/dst IP
        System.arraycopy(originalRequest, 16, packet, 12, 4); // src = original dst
        System.arraycopy(originalRequest, 12, packet, 16, 4); // dst = original src
        // IP checksum
        fillIpChecksum(packet);

        // UDP header — swap ports
        packet[20] = originalRequest[ipHeaderLen + 2]; packet[21] = originalRequest[ipHeaderLen + 3]; // src port
        packet[22] = originalRequest[ipHeaderLen];     packet[23] = originalRequest[ipHeaderLen + 1]; // dst port
        int udpLen = 8 + dnsPayload.length;
        packet[24] = (byte) ((udpLen >> 8) & 0xFF);
        packet[25] = (byte) (udpLen & 0xFF);
        packet[26] = 0; packet[27] = 0; // checksum (optional for IPv4 UDP)

        System.arraycopy(dnsPayload, 0, packet, 28, dnsPayload.length);
        return packet;
    }

    private void fillIpChecksum(byte[] header) {
        header[10] = 0; header[11] = 0;
        int sum = 0;
        for (int i = 0; i < 20; i += 2) {
            sum += ((header[i] & 0xFF) << 8) | (header[i + 1] & 0xFF);
        }
        while ((sum >> 16) != 0) sum = (sum & 0xFFFF) + (sum >> 16);
        sum = ~sum;
        header[10] = (byte) ((sum >> 8) & 0xFF);
        header[11] = (byte) (sum & 0xFF);
    }

    // ── Foreground notification (required for Android 8+) ────────────────
    private void startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "ScreenGuard VPN",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Active while blocking is enabled");
            NotificationManager nm = getSystemService(NotificationManager.class);
            nm.createNotificationChannel(channel);
        }

        Intent stopIntent = new Intent(this, ScreenGuardVpnService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 0, stopIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent openPi = PendingIntent.getActivity(this, 0, openIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        Notification notif = builder
                .setContentTitle("ScreenGuard Active")
                .setContentText("Blocking " + blockedDomains.size() + " sites")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(openPi)
                .addAction(android.R.drawable.ic_delete, "Stop Blocking", stopPi)
                .setOngoing(true)
                .build();

        startForeground(NOTIF_ID, notif);
    }
}
