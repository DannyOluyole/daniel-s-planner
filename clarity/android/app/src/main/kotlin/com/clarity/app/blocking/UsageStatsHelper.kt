package com.clarity.app.blocking

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Process
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Reads per-app screen time for today using UsageStatsManager.
 *
 * Requires permission: android.permission.PACKAGE_USAGE_STATS
 * User must grant via: Settings → Apps → Special app access → Usage access
 */
object UsageStatsHelper {

    fun hasPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode   = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    /**
     * Returns a JSON array of { packageName, appName, minutesUsed } for today,
     * sorted descending by usage. Only includes apps with > 0 minutes.
     */
    fun getTodayUsage(context: Context): JSONArray {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val pm  = context.packageManager

        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startMs = cal.timeInMillis
        val endMs   = System.currentTimeMillis()

        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startMs, endMs)
            ?: return JSONArray()

        val result = JSONArray()
        stats
            .filter { it.totalTimeInForeground > 0 }
            .sortedByDescending { it.totalTimeInForeground }
            .forEach { stat ->
                val label = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(stat.packageName, 0)).toString()
                } catch (_: Exception) { stat.packageName }

                result.put(JSONObject().apply {
                    put("packageName",  stat.packageName)
                    put("appName",      label)
                    put("minutesUsed",  stat.totalTimeInForeground / 60_000)
                })
            }

        return result
    }

    /** Total screen time in minutes today across all apps. */
    fun getTotalMinutesToday(context: Context): Long {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0);      set(Calendar.MILLISECOND, 0)
        }
        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            cal.timeInMillis,
            System.currentTimeMillis()
        ) ?: return 0L
        return stats.sumOf { it.totalTimeInForeground } / 60_000
    }

    /**
     * Returns a JSON array of { packageName, appName, opens } between
     * [startMs, endMs), counting how many times each app was brought to the
     * foreground. Sorted descending. Only includes apps opened at least once.
     */
    fun getAppOpens(context: Context, startMs: Long, endMs: Long): JSONArray {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val pm  = context.packageManager
        val events = usm.queryEvents(startMs, endMs)
        val counts = mutableMapOf<String, Int>()
        val event  = UsageEvents.Event()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                counts[event.packageName] = (counts[event.packageName] ?: 0) + 1
            }
        }

        val result = JSONArray()
        counts.entries
            .sortedByDescending { it.value }
            .forEach { (pkg, opens) ->
                val label = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
                } catch (_: Exception) { pkg }

                result.put(JSONObject().apply {
                    put("packageName", pkg)
                    put("appName",     label)
                    put("opens",       opens)
                })
            }
        return result
    }

    /**
     * Returns a JSON array of 7 entries { dateMillis, value } for the past
     * [days] days (oldest first, today last). [metric] is "screenTime"
     * (total minutes) or "opens" (total app-open count).
     */
    fun getDailyTotals(context: Context, metric: String, days: Int = 7): JSONArray {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val result = JSONArray()
        val cal = Calendar.getInstance()

        for (i in (days - 1) downTo 0) {
            val dayCal = cal.clone() as Calendar
            dayCal.add(Calendar.DAY_OF_YEAR, -i)
            dayCal.set(Calendar.HOUR_OF_DAY, 0)
            dayCal.set(Calendar.MINUTE, 0)
            dayCal.set(Calendar.SECOND, 0)
            dayCal.set(Calendar.MILLISECOND, 0)
            val startMs = dayCal.timeInMillis
            val endMs   = minOf(startMs + 24L * 60 * 60 * 1000, System.currentTimeMillis())

            val value: Long = if (metric == "opens") {
                val events = usm.queryEvents(startMs, endMs)
                val event  = UsageEvents.Event()
                var count  = 0L
                while (events.hasNextEvent()) {
                    events.getNextEvent(event)
                    if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                        event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                        count++
                    }
                }
                count
            } else {
                val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startMs, endMs)
                (stats?.sumOf { it.totalTimeInForeground } ?: 0L) / 60_000
            }

            result.put(JSONObject().apply {
                put("dateMillis", startMs)
                put("value", value)
            })
        }
        return result
    }
}
