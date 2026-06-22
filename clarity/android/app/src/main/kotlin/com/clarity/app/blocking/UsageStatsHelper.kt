package com.clarity.app.blocking

import android.app.AppOpsManager
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
}
