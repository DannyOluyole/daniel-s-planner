package com.clarity.app.blocking

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices
import org.json.JSONArray
import org.json.JSONObject

/**
 * Manages geofences and the SharedPreferences keys for location-based blocking.
 *
 * Key layout in "clarity_blocking" SharedPreferences:
 *   manually_blocked_packages  — JSON array; apps the user manually toggled on
 *   location_rules             — JSON array of {id,name,lat,lng,radius,packages[]}
 *   active_geofences           — StringSet of rule IDs the device is currently inside
 *   blocked_packages           — JSON array; union of manual + active-location (read by ClarityBlockingService)
 */
object LocationBlockingHelper {

    // ── Geofence registration ────────────────────────────────────────────────

    fun addGeofence(context: Context, id: String, lat: Double, lng: Double, radiusM: Float) {
        val client   = geofencingClient(context)
        val geofence = Geofence.Builder()
            .setRequestId(id)
            .setCircularRegion(lat, lng, radiusM)
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(
                Geofence.GEOFENCE_TRANSITION_ENTER or
                Geofence.GEOFENCE_TRANSITION_EXIT  or
                Geofence.GEOFENCE_TRANSITION_DWELL
            )
            .setLoiteringDelay(30_000) // 30s dwell before DWELL fires
            .build()

        val request = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER or GeofencingRequest.INITIAL_TRIGGER_DWELL)
            .addGeofence(geofence)
            .build()

        try {
            client.addGeofences(request, pendingIntent(context)).addOnFailureListener {}
        } catch (_: SecurityException) {}
    }

    fun removeGeofence(context: Context, id: String) {
        geofencingClient(context).removeGeofences(listOf(id)).addOnFailureListener {}
    }

    fun reRegisterAll(context: Context, prefs: SharedPreferences) {
        val rules = loadRules(prefs)
        for (i in 0 until rules.length()) {
            val r = rules.getJSONObject(i)
            addGeofence(context, r.getString("id"),
                r.getDouble("lat"), r.getDouble("lng"), r.getDouble("radius").toFloat())
        }
    }

    // ── Package merging ──────────────────────────────────────────────────────

    /** Call whenever manually_blocked_packages or active_geofences changes. */
    fun rebuildBlockedPackages(prefs: SharedPreferences, activeIds: Set<String>? = null) {
        val active  = activeIds ?: prefs.getStringSet("active_geofences", emptySet())!!
        val manual  = jsonArrayToSet(prefs.getString("manually_blocked_packages", "[]") ?: "[]")
        val located = locationBlockedPackages(prefs, active)
        val merged  = (manual + located).toList()
        prefs.edit().putString("blocked_packages", JSONArray(merged).toString()).apply()
    }

    private fun locationBlockedPackages(prefs: SharedPreferences, activeIds: Set<String>): Set<String> {
        val result = mutableSetOf<String>()
        val rules  = loadRules(prefs)
        for (i in 0 until rules.length()) {
            val r = rules.getJSONObject(i)
            if (r.getString("id") in activeIds) {
                val pkgs = r.getJSONArray("packages")
                for (j in 0 until pkgs.length()) result.add(pkgs.getString(j))
            }
        }
        return result
    }

    // ── Rule persistence ─────────────────────────────────────────────────────

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
        prefs.edit().putString("location_rules", result.toString()).apply()
    }

    fun removeRule(prefs: SharedPreferences, id: String) {
        val rules  = loadRules(prefs)
        val result = JSONArray()
        for (i in 0 until rules.length()) {
            val r = rules.getJSONObject(i)
            if (r.getString("id") != id) result.put(r)
        }
        prefs.edit().putString("location_rules", result.toString()).apply()
    }

    fun loadRules(prefs: SharedPreferences): JSONArray {
        return try {
            JSONArray(prefs.getString("location_rules", "[]") ?: "[]")
        } catch (_: Exception) { JSONArray() }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private fun jsonArrayToSet(json: String): Set<String> = try {
        val arr = JSONArray(json)
        (0 until arr.length()).map { arr.getString(it) }.toSet()
    } catch (_: Exception) { emptySet() }

    private fun geofencingClient(context: Context): GeofencingClient =
        LocationServices.getGeofencingClient(context)

    private fun pendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, GeofenceReceiver::class.java)
        return PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )
    }
}
