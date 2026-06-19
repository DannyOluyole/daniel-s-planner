package com.example.clarity

import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import org.json.JSONArray
import com.example.clarity.blocking.ClarityVpnService
import com.example.clarity.blocking.UsageStatsHelper

class MainActivity : FlutterActivity() {

    private val channel = "com.example.clarity/blocking"
    private lateinit var prefs: SharedPreferences

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        prefs = getSharedPreferences("clarity_blocking", MODE_PRIVATE)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channel)
            .setMethodCallHandler { call, result ->
                when (call.method) {

                    // ── Permissions ────────────────────────────────────────
                    "hasUsagePermission" ->
                        result.success(UsageStatsHelper.hasPermission(this))

                    "requestUsagePermission" -> {
                        startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                        result.success(null)
                    }

                    "hasAccessibilityPermission" ->
                        result.success(isAccessibilityEnabled())

                    "requestAccessibilityPermission" -> {
                        startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                        result.success(null)
                    }

                    "hasVpnPermission" ->
                        result.success(VpnService.prepare(this) == null)

                    "requestVpnPermission" -> {
                        val intent = VpnService.prepare(this)
                        if (intent != null) startActivityForResult(intent, VPN_REQUEST_CODE)
                        result.success(null)
                    }

                    "getInstalledApps" -> {
                        result.success(getInstalledLaunchableApps())
                    }

                    // ── Usage stats ────────────────────────────────────────
                    "getTodayUsage" -> {
                        if (!UsageStatsHelper.hasPermission(this)) {
                            result.error("NO_PERMISSION", "Usage access not granted", null)
                        } else {
                            result.success(UsageStatsHelper.getTodayUsage(this).toString())
                        }
                    }

                    "getTotalMinutesToday" -> {
                        if (!UsageStatsHelper.hasPermission(this)) {
                            result.error("NO_PERMISSION", "Usage access not granted", null)
                        } else {
                            result.success(UsageStatsHelper.getTotalMinutesToday(this))
                        }
                    }

                    // ── Block config ───────────────────────────────────────
                    "updateBlockedApps" -> {
                        val packages = call.argument<List<String>>("packages") ?: emptyList()
                        prefs.edit()
                            .putString("blocked_packages", JSONArray(packages).toString())
                            .apply()
                        result.success(null)
                    }

                    "updateBlockedDomains" -> {
                        val domains = call.argument<List<String>>("domains") ?: emptyList()
                        prefs.edit()
                            .putString("blocked_domains", JSONArray(domains).toString())
                            .apply()
                        result.success(null)
                    }

                    "updateBlockedKeywords" -> {
                        val keywords = call.argument<List<String>>("keywords") ?: emptyList()
                        prefs.edit()
                            .putString("blocked_keywords", JSONArray(keywords).toString())
                            .apply()
                        result.success(null)
                    }

                    "setStrictness" -> {
                        val level = call.argument<Int>("level") ?: 1
                        prefs.edit().putInt("strictness", level).apply()
                        result.success(null)
                    }

                    "updateAppLimits" -> {
                        val limitsJson = call.argument<String>("limits") ?: "{}"
                        prefs.edit().putString("app_limits", limitsJson).apply()
                        result.success(null)
                    }

                    "getAppLimitStats" -> {
                        result.success(prefs.getString("app_stats", "{}"))
                    }

                    // ── VPN (website blocking) ─────────────────────────────
                    "startVpn" -> {
                        startService(
                            Intent(this, ClarityVpnService::class.java).setAction("START")
                        )
                        result.success(null)
                    }

                    "stopVpn" -> {
                        startService(
                            Intent(this, ClarityVpnService::class.java).setAction("STOP")
                        )
                        result.success(null)
                    }

                    else -> result.notImplemented()
                }
            }
    }

    private fun getInstalledLaunchableApps(): String {
        val pm = packageManager
        val launcherIntent = Intent(Intent.ACTION_MAIN, null)
        launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER)
        val resolved = pm.queryIntentActivities(launcherIntent, 0)
        val apps = JSONArray()
        val seen = HashSet<String>()
        for (info in resolved) {
            val pkg = info.activityInfo.packageName
            if (pkg == packageName || !seen.add(pkg)) continue
            val obj = org.json.JSONObject()
            obj.put("packageName", pkg)
            obj.put("appName", info.loadLabel(pm).toString())
            apps.put(obj)
        }
        return apps.toString()
    }

    private fun isAccessibilityEnabled(): Boolean {
        val service = "${packageName}/${packageName}.blocking.ClarityBlockingService"
        val enabled = Settings.Secure.getString(
            contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabled.contains(service)
    }

    companion object {
        private const val VPN_REQUEST_CODE = 1001
    }
}
