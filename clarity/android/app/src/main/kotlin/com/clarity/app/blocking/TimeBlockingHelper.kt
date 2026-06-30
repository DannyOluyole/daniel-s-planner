package com.clarity.app.blocking

import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Manages time-window blocking rules in SharedPreferences and answers
 * "is this package currently blocked by a time rule" queries.
 *
 * Key layout in "clarity_blocking" SharedPreferences:
 *   time_rules — JSON array of {id,name,start,end,days[7],packages[],appNames[]}
 *     start/end are minutes-since-midnight (0-1439); a rule whose end < start
 *     is treated as crossing midnight. days[0]=Monday .. days[6]=Sunday.
 */
object TimeBlockingHelper {

    fun saveRule(prefs: SharedPreferences, ruleJson: JSONObject) {
        val rules  = loadRules(prefs)
        val id     = ruleJson.getString("id")
        val result = JSONArray()
        var found  = false
        for (i in 0 until rules.length()) {
            val r = rules.getJSONObject(i)
            if (r.getString("id") == id) { result.put(ruleJson); found = true }
            else result.put(r)
        }
        if (!found) result.put(ruleJson)
        prefs.edit().putString("time_rules", result.toString()).apply()
    }

    fun removeRule(prefs: SharedPreferences, id: String) {
        val rules  = loadRules(prefs)
        val result = JSONArray()
        for (i in 0 until rules.length()) {
            val r = rules.getJSONObject(i)
            if (r.getString("id") != id) result.put(r)
        }
        prefs.edit().putString("time_rules", result.toString()).apply()
    }

    fun loadRules(prefs: SharedPreferences): JSONArray {
        return try {
            JSONArray(prefs.getString("time_rules", "[]") ?: "[]")
        } catch (_: Exception) { JSONArray() }
    }

    /** True if [pkg] is blocked by any active time rule right now. */
    fun isBlockedNow(prefs: SharedPreferences, pkg: String): Boolean {
        val rules = loadRules(prefs)
        if (rules.length() == 0) return false

        val cal = Calendar.getInstance()
        // Calendar.DAY_OF_WEEK: Sunday=1..Saturday=7 → convert to Monday=0..Sunday=6
        val weekdayIndex = (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7
        val nowMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

        for (i in 0 until rules.length()) {
            val r = rules.getJSONObject(i)
            val packages = r.getJSONArray("packages")
            var hasPkg = false
            for (j in 0 until packages.length()) {
                if (packages.getString(j) == pkg) { hasPkg = true; break }
            }
            if (!hasPkg) continue

            val days = r.getJSONArray("days")
            if (!days.getBoolean(weekdayIndex)) continue

            val start = r.getInt("start")
            val end   = r.getInt("end")
            val active = if (start <= end) {
                nowMinutes in start until end
            } else {
                nowMinutes >= start || nowMinutes < end
            }
            if (active) return true
        }
        return false
    }
}
