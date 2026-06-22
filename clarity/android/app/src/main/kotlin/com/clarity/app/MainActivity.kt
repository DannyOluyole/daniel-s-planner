package com.clarity.app

import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import org.json.JSONArray
import com.clarity.app.blocking.ClarityVpnService
import com.clarity.app.blocking.NotificationCounterService
import com.clarity.app.blocking.UsageStatsHelper
import java.util.Calendar

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
                        startActivity(buildUsageAccessIntent())
                        result.success(null)
                    }

                    "hasAccessibilityPermission" ->
                        result.success(isAccessibilityEnabled())

                    "requestAccessibilityPermission" -> {
                        startActivity(buildAccessibilitySettingsIntent())
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

                    // ── App activity (screen time / opens / notifications) ──

                    "hasNotificationPermission" ->
                        result.success(NotificationCounterService.hasAccess(this))

                    "requestNotificationPermission" -> {
                        startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                        result.success(null)
                    }

                    "getAppOpens" -> {
                        if (!UsageStatsHelper.hasPermission(this)) {
                            result.error("NO_PERMISSION", "Usage access not granted", null)
                        } else {
                            val dayStart = call.argument<Long>("dayStart") ?: startOfToday()
                            val dayEnd   = call.argument<Long>("dayEnd") ?: System.currentTimeMillis()
                            result.success(UsageStatsHelper.getAppOpens(this, dayStart, dayEnd).toString())
                        }
                    }

                    "getNotificationsForDay" -> {
                        val dayStart = call.argument<Long>("dayStart") ?: startOfToday()
                        result.success(NotificationCounterService.getCountsForDay(this, dayStart).toString())
                    }

                    "getWeeklyTotals" -> {
                        val metric = call.argument<String>("metric") ?: "screenTime"
                        val totals = when (metric) {
                            "notifications" -> NotificationCounterService.getDailyTotals(this)
                            else            -> UsageStatsHelper.getDailyTotals(this, metric)
                        }
                        result.success(totals.toString())
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

    // Tries to deep-link straight to this app's usage-access entry. Most OEMs
    // honour the "package:" data URI on this action (same convention as
    // ACTION_APPLICATION_DETAILS_SETTINGS); falls back to the generic list
    // when a device's Settings app can't resolve the deep link.
    private fun buildUsageAccessIntent(): Intent {
        val deepLink = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            .setData(android.net.Uri.parse("package:$packageName"))
        return if (deepLink.resolveActivity(packageManager) != null) {
            deepLink
        } else {
            Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        }
    }

    // On Android 12+ this deep-links straight to this app's accessibility
    // service toggle; older versions fall back to the generic service list
    // since there's no public deep-link API before ACTION_ACCESSIBILITY_DETAILS_SETTINGS.
    private fun buildAccessibilitySettingsIntent(): Intent {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val component = android.content.ComponentName(
                this, com.clarity.app.blocking.ClarityBlockingService::class.java
            )
            val deepLink = Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS")
                .putExtra("android.provider.extra.ACCESSIBILITY_COMPONENT_NAME", component.flattenToString())
            if (deepLink.resolveActivity(packageManager) != null) return deepLink
        }
        return Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    }

    private fun isAccessibilityEnabled(): Boolean {
        val service = "${packageName}/${packageName}.blocking.ClarityBlockingService"
        val enabled = Settings.Secure.getString(
            contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabled.contains(service)
    }

    private fun startOfToday(): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    companion object {
        private const val VPN_REQUEST_CODE = 1001
    }
}
