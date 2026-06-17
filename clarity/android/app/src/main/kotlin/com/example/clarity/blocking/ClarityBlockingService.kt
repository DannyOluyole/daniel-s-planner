package com.example.clarity.blocking

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Watches for foreground app changes. When a blocked app comes to the front,
 * launches BlockedOverlayActivity. Also enforces per-app daily open-count
 * and time-of-use limits, tracked locally and reset every day.
 *
 * Enabled via: Settings → Accessibility → Productivity Max → turn on
 * (User must grant manually — Android requirement.)
 */
class ClarityBlockingService : AccessibilityService() {

    private lateinit var prefs: SharedPreferences
    private val handler = Handler(Looper.getMainLooper())

    private var currentPkg: String? = null
    private var sessionStartMs: Long = 0L

    private data class Limit(val openLimit: Int?, val timeLimitMin: Int?)
    private data class Stats(var opens: Int, var seconds: Int, var day: String,
                              var warnedOpen: Boolean, var warnedTime: Boolean)

    private val tickRunnable = object : Runnable {
        override fun run() {
            checkOngoingSession()
            handler.postDelayed(this, TICK_MS)
        }
    }

    override fun onServiceConnected() {
        prefs = getSharedPreferences("clarity_blocking", MODE_PRIVATE)
        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes  = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags       = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
        handler.post(tickRunnable)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg == packageName || pkg == "com.android.systemui") return
        if (pkg == currentPkg) return

        flushSession()
        currentPkg = pkg
        sessionStartMs = System.currentTimeMillis()

        if (loadBlockedApps().contains(pkg)) {
            launchOverlay(pkg, "BLOCKED")
            return
        }

        val limit = loadLimits()[pkg] ?: return
        val stats = loadStatsFor(pkg)

        if (limit.openLimit != null) {
            val newOpens = stats.opens + 1
            stats.opens = newOpens
            saveStats(pkg, stats)
            if (newOpens > limit.openLimit) {
                launchOverlay(pkg, "OPEN_LIMIT_BLOCKED", limit, stats)
                return
            } else if (newOpens == limit.openLimit) {
                launchOverlay(pkg, "OPEN_LIMIT_WARNING", limit, stats)
            }
        }

        if (limit.timeLimitMin != null && stats.seconds >= limit.timeLimitMin * 60) {
            launchOverlay(pkg, "TIME_LIMIT_BLOCKED", limit, stats)
        }
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        handler.removeCallbacks(tickRunnable)
        super.onDestroy()
    }

    // ── Session / time tracking ────────────────────────────────────────────

    private fun flushSession() {
        val pkg = currentPkg ?: return
        val elapsed = ((System.currentTimeMillis() - sessionStartMs) / 1000).toInt()
        sessionStartMs = System.currentTimeMillis()
        if (elapsed <= 0) return
        val limit = loadLimits()[pkg] ?: return
        if (limit.timeLimitMin == null) return
        val stats = loadStatsFor(pkg)
        stats.seconds += elapsed
        saveStats(pkg, stats)
    }

    private fun checkOngoingSession() {
        val pkg = currentPkg ?: return
        val limit = loadLimits()[pkg] ?: return
        if (limit.timeLimitMin == null) return

        val elapsed = ((System.currentTimeMillis() - sessionStartMs) / 1000).toInt()
        if (elapsed <= 0) return
        val stats = loadStatsFor(pkg)
        val total = stats.seconds + elapsed
        val limitSeconds = limit.timeLimitMin * 60

        if (total >= limitSeconds) {
            stats.seconds = total
            sessionStartMs = System.currentTimeMillis()
            saveStats(pkg, stats)
            launchOverlay(pkg, "TIME_LIMIT_BLOCKED", limit, stats)
        } else if (total >= limitSeconds - WARNING_WINDOW_SECONDS && !stats.warnedTime) {
            stats.seconds = total
            stats.warnedTime = true
            sessionStartMs = System.currentTimeMillis()
            saveStats(pkg, stats)
            launchOverlay(pkg, "TIME_LIMIT_WARNING", limit, stats)
        }
    }

    // ── Persistence ─────────────────────────────────────────────────────────

    private fun loadBlockedApps(): Set<String> {
        val json = prefs.getString("blocked_packages", "[]") ?: "[]"
        val arr  = JSONArray(json)
        return (0 until arr.length()).map { arr.getString(it) }.toSet()
    }

    private fun loadLimits(): Map<String, Limit> {
        val json = prefs.getString("app_limits", "{}") ?: "{}"
        val obj  = JSONObject(json)
        val out  = mutableMapOf<String, Limit>()
        for (pkg in obj.keys()) {
            val o = obj.getJSONObject(pkg)
            val openLimit = if (o.has("openLimit") && !o.isNull("openLimit")) o.getInt("openLimit") else null
            val timeLimit = if (o.has("timeLimit") && !o.isNull("timeLimit")) o.getInt("timeLimit") else null
            if (openLimit != null || timeLimit != null) out[pkg] = Limit(openLimit, timeLimit)
        }
        return out
    }

    private fun loadStatsFor(pkg: String): Stats {
        val today = todayKey()
        val json = prefs.getString("app_stats", "{}") ?: "{}"
        val obj  = JSONObject(json)
        if (!obj.has(pkg)) return Stats(0, 0, today, false, false)
        val o = obj.getJSONObject(pkg)
        val day = o.optString("day", "")
        if (day != today) return Stats(0, 0, today, false, false)
        return Stats(
            o.optInt("opens", 0),
            o.optInt("seconds", 0),
            day,
            o.optBoolean("warnedOpen", false),
            o.optBoolean("warnedTime", false),
        )
    }

    private fun saveStats(pkg: String, stats: Stats) {
        val json = prefs.getString("app_stats", "{}") ?: "{}"
        val obj  = JSONObject(json)
        val o = JSONObject().apply {
            put("opens", stats.opens)
            put("seconds", stats.seconds)
            put("day", stats.day)
            put("warnedOpen", stats.warnedOpen)
            put("warnedTime", stats.warnedTime)
        }
        obj.put(pkg, o)
        prefs.edit().putString("app_stats", obj.toString()).apply()
    }

    private fun todayKey(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    // ── Overlay ─────────────────────────────────────────────────────────────

    private fun launchOverlay(
        pkg: String,
        type: String,
        limit: Limit? = null,
        stats: Stats? = null,
    ) {
        val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("blocked_package", pkg)
            putExtra("strictness", prefs.getInt("strictness", 1))
            putExtra("overlay_type", type)
            if (limit?.openLimit != null) putExtra("open_limit", limit.openLimit)
            if (limit?.timeLimitMin != null) putExtra("time_limit_min", limit.timeLimitMin)
            if (stats != null) {
                putExtra("opens_today", stats.opens)
                putExtra("seconds_today", stats.seconds)
            }
        }
        startActivity(intent)
    }

    companion object {
        private const val TICK_MS = 15_000L
        private const val WARNING_WINDOW_SECONDS = 120
    }
}
