package com.clarity.app

import android.Manifest
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.location.Location
import android.net.VpnService
import android.os.Looper
import android.provider.Settings
import android.util.Base64
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import io.flutter.embedding.android.FlutterActivity
import java.io.ByteArrayOutputStream
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import org.json.JSONArray
import org.json.JSONObject
import com.clarity.app.blocking.ClarityVpnService
import com.clarity.app.blocking.LocationBlockingHelper
import com.clarity.app.blocking.TimeBlockingHelper
import com.clarity.app.blocking.NotificationCounterService
import com.clarity.app.blocking.UsageStatsHelper
import java.util.Calendar
import java.util.UUID

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

                    "getAppIcon" -> {
                        val pkg = call.argument<String>("packageName")
                        if (pkg == null) {
                            result.success(null)
                        } else {
                            result.success(getAppIconBase64(pkg))
                        }
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
                        // Write to manually_blocked_packages so geofence receiver can
                        // merge location-based blocks on top without clobbering them.
                        prefs.edit()
                            .putString("manually_blocked_packages", JSONArray(packages).toString())
                            .apply()
                        LocationBlockingHelper.rebuildBlockedPackages(prefs)
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

                    // ── Location blocking ─────────────────────────────────
                    "hasLocationPermission" -> {
                        val fine = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                        val bg   = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q)
                            ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED
                        else true
                        result.success(fine && bg)
                    }

                    "requestLocationPermission" -> {
                        // Android 12+ requires background location to be requested in a
                        // separate call AFTER fine/coarse are already granted.
                        val fineGranted = ActivityCompat.checkSelfPermission(
                            this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                        if (fineGranted && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                            ActivityCompat.requestPermissions(
                                this,
                                arrayOf(Manifest.permission.ACCESS_BACKGROUND_LOCATION),
                                LOCATION_PERMISSION_CODE
                            )
                        } else {
                            ActivityCompat.requestPermissions(
                                this,
                                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
                                LOCATION_PERMISSION_CODE
                            )
                        }
                        result.success(null)
                    }

                    "getCurrentLocation" -> {
                        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                            result.error("NO_PERMISSION", "Location permission not granted", null)
                            return@setMethodCallHandler
                        }
                        val fusedClient = LocationServices.getFusedLocationProviderClient(this)
                        // Try last known first for speed; fall back to a fresh request
                        fusedClient.lastLocation.addOnSuccessListener { loc: Location? ->
                            if (loc != null) {
                                result.success(mapOf("lat" to loc.latitude, "lng" to loc.longitude, "accuracy" to loc.accuracy.toDouble()))
                            } else {
                                val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000L).setMaxUpdates(1).build()
                                fusedClient.requestLocationUpdates(req, object : LocationCallback() {
                                    override fun onLocationResult(r: LocationResult) {
                                        fusedClient.removeLocationUpdates(this)
                                        val l = r.lastLocation
                                        if (l != null) result.success(mapOf("lat" to l.latitude, "lng" to l.longitude, "accuracy" to l.accuracy.toDouble()))
                                        else result.error("UNAVAILABLE", "Could not get location", null)
                                    }
                                }, Looper.getMainLooper())
                            }
                        }.addOnFailureListener { e -> result.error("ERROR", e.message, null) }
                    }

                    "saveLocationRule" -> {
                        val id       = call.argument<String>("id") ?: UUID.randomUUID().toString()
                        val name     = call.argument<String>("name") ?: "Location"
                        val lat      = call.argument<Double>("lat") ?: 0.0
                        val lng      = call.argument<Double>("lng") ?: 0.0
                        val radius   = (call.argument<Double>("radius") ?: 100.0).toFloat()
                        val packages = call.argument<List<String>>("packages") ?: emptyList()
                        val appNames = call.argument<List<String>>("appNames") ?: emptyList()

                        val rule = JSONObject().apply {
                            put("id", id); put("name", name)
                            put("lat", lat); put("lng", lng); put("radius", radius.toDouble())
                            put("packages", JSONArray(packages))
                            put("appNames", JSONArray(appNames))
                        }
                        LocationBlockingHelper.saveRule(prefs, rule)
                        LocationBlockingHelper.addGeofence(this, id, lat, lng, radius)
                        result.success(id)
                    }

                    "removeLocationRule" -> {
                        val id = call.argument<String>("id") ?: ""
                        LocationBlockingHelper.removeGeofence(this, id)
                        LocationBlockingHelper.removeRule(prefs, id)
                        val active = prefs.getStringSet("active_geofences", emptySet())!!.toMutableSet()
                        active.remove(id)
                        prefs.edit().putStringSet("active_geofences", active).apply()
                        LocationBlockingHelper.rebuildBlockedPackages(prefs, active)
                        result.success(null)
                    }

                    "getLocationRules" -> {
                        result.success(LocationBlockingHelper.loadRules(prefs).toString())
                    }

                    "getActiveGeofences" -> {
                        result.success(prefs.getStringSet("active_geofences", emptySet())!!.toList())
                    }

                    // ── Time-window blocking ────────────────────────────────
                    "saveTimeRule" -> {
                        val id       = call.argument<String>("id") ?: UUID.randomUUID().toString()
                        val name     = call.argument<String>("name") ?: "Schedule"
                        val start    = call.argument<Int>("start") ?: 0
                        val end      = call.argument<Int>("end") ?: 0
                        val days     = call.argument<List<Boolean>>("days") ?: List(7) { false }
                        val packages = call.argument<List<String>>("packages") ?: emptyList()
                        val appNames = call.argument<List<String>>("appNames") ?: emptyList()

                        val rule = JSONObject().apply {
                            put("id", id); put("name", name)
                            put("start", start); put("end", end)
                            put("days", JSONArray(days))
                            put("packages", JSONArray(packages))
                            put("appNames", JSONArray(appNames))
                        }
                        TimeBlockingHelper.saveRule(prefs, rule)
                        result.success(id)
                    }

                    "removeTimeRule" -> {
                        val id = call.argument<String>("id") ?: ""
                        TimeBlockingHelper.removeRule(prefs, id)
                        result.success(null)
                    }

                    "getTimeRules" -> {
                        result.success(TimeBlockingHelper.loadRules(prefs).toString())
                    }

                    else -> result.notImplemented()
                }
            }
    }

    private fun getAppIconBase64(packageName: String): String? {
        return try {
            val drawable = packageManager.getApplicationIcon(packageName)
            val bitmap = if (drawable is BitmapDrawable) {
                drawable.bitmap
            } else {
                val bmp = Bitmap.createBitmap(drawable.intrinsicWidth.coerceAtLeast(1),
                    drawable.intrinsicHeight.coerceAtLeast(1), Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bmp)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                bmp
            }
            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) {
            null
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
        private const val VPN_REQUEST_CODE      = 1001
        private const val LOCATION_PERMISSION_CODE = 1002
    }
}
