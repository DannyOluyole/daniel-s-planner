package com.clarity.app.blocking

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.GeofencingEvent
import com.google.android.gms.location.Geofence

/**
 * Receives geofence enter/exit events from Google Play Services and
 * updates the combined blocked-packages set in SharedPreferences so that
 * ClarityBlockingService immediately picks up the change.
 */
class GeofenceReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val event = GeofencingEvent.fromIntent(intent) ?: return
        if (event.hasError()) return

        val ids = event.triggeringGeofences?.map { it.requestId } ?: return
        val prefs = context.getSharedPreferences("clarity_blocking", Context.MODE_PRIVATE)
        val active = prefs.getStringSet("active_geofences", emptySet())!!.toMutableSet()

        when (event.geofenceTransition) {
            Geofence.GEOFENCE_TRANSITION_ENTER,
            Geofence.GEOFENCE_TRANSITION_DWELL -> active.addAll(ids)
            Geofence.GEOFENCE_TRANSITION_EXIT  -> active.removeAll(ids.toSet())
        }

        prefs.edit().putStringSet("active_geofences", active).apply()
        LocationBlockingHelper.rebuildBlockedPackages(prefs, active)
    }
}
