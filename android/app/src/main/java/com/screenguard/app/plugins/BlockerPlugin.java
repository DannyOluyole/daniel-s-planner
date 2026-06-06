package com.screenguard.app.plugins;

import android.content.Context;
import android.content.Intent;
import android.net.VpnService;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "Blocker")
public class BlockerPlugin extends Plugin {

    private static final int VPN_REQUEST_CODE = 1001;
    private PluginCall savedCall;

    @PluginMethod
    public void isVpnPermissionGranted(PluginCall call) {
        Intent vpnIntent = VpnService.prepare(getContext());
        JSObject ret = new JSObject();
        ret.put("granted", vpnIntent == null);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestVpnPermission(PluginCall call) {
        Intent vpnIntent = VpnService.prepare(getContext());
        if (vpnIntent == null) {
            // Already granted
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        savedCall = call;
        getActivity().startActivityForResult(vpnIntent, VPN_REQUEST_CODE);
    }

    @PluginMethod
    public void startBlocking(PluginCall call) {
        JSArray sites = call.getArray("domains");
        if (sites == null) {
            call.reject("INVALID_ARGS", "domains array required");
            return;
        }

        List<String> domains = new ArrayList<>();
        try {
            JSONArray arr = sites.toJSONArray();
            for (int i = 0; i < arr.length(); i++) {
                domains.add(arr.getString(i));
            }
        } catch (JSONException e) {
            call.reject("PARSE_ERROR", e.getMessage());
            return;
        }

        // Store blocklist and start VPN service
        ScreenGuardVpnService.setBlockedDomains(domains);
        Intent intent = new Intent(getContext(), ScreenGuardVpnService.class);
        intent.setAction(ScreenGuardVpnService.ACTION_START);
        getContext().startService(intent);

        JSObject ret = new JSObject();
        ret.put("started", true);
        ret.put("blockedCount", domains.size());
        call.resolve(ret);
    }

    @PluginMethod
    public void stopBlocking(PluginCall call) {
        Intent intent = new Intent(getContext(), ScreenGuardVpnService.class);
        intent.setAction(ScreenGuardVpnService.ACTION_STOP);
        getContext().startService(intent);

        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isBlocking(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", ScreenGuardVpnService.isRunning());
        call.resolve(ret);
    }

    @PluginMethod
    public void updateBlocklist(PluginCall call) {
        JSArray sites = call.getArray("domains");
        if (sites == null) {
            call.reject("INVALID_ARGS", "domains array required");
            return;
        }
        List<String> domains = new ArrayList<>();
        try {
            JSONArray arr = sites.toJSONArray();
            for (int i = 0; i < arr.length(); i++) {
                domains.add(arr.getString(i));
            }
        } catch (JSONException e) {
            call.reject("PARSE_ERROR", e.getMessage());
            return;
        }
        ScreenGuardVpnService.setBlockedDomains(domains);

        JSObject ret = new JSObject();
        ret.put("updated", true);
        ret.put("count", domains.size());
        call.resolve(ret);
    }
}
