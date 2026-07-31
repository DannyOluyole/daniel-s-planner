import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WatchedPlace } from "@domain/entities/WatchedPlace";
import { Copy } from "@core/copy/strings";

export const GEOFENCE_TASK_NAME = "pause-money-place-geofence";

// Same cooldown as the foreground fallback (useNearbyPlace) — long enough to
// cover the rest of a single shopping trip without re-alerting on every
// GPS-jitter re-entry, short enough to nudge again on the next real visit.
const RENOTIFY_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const LAST_NOTIFIED_KEY_PREFIX = "checkpoint:geofence-last-notified:";

// A geofence region's `identifier` is the only per-region data the OS hands
// back on arrival — there's no separate payload field. Encoding the place's
// name into it means the task never needs a DB/network round trip to know
// what to show, which matters here specifically: background task execution
// windows are short and not guaranteed, so the fewer things that can fail
// between "OS wakes the task" and "notification shown," the better.
function encodeRegionIdentifier(place: WatchedPlace): string {
  return `${place.id}::${encodeURIComponent(place.name)}`;
}

function decodeRegionIdentifier(identifier: string): { placeId: string; name: string } | null {
  const [placeId, encodedName] = identifier.split("::");
  if (!placeId || !encodedName) return null;
  try {
    return { placeId, name: decodeURIComponent(encodedName) };
  } catch {
    return null;
  }
}

async function shouldNotify(placeId: string): Promise<boolean> {
  const key = `${LAST_NOTIFIED_KEY_PREFIX}${placeId}`;
  const last = await AsyncStorage.getItem(key);
  const now = Date.now();
  if (last && now - Number(last) < RENOTIFY_COOLDOWN_MS) return false;
  await AsyncStorage.setItem(key, String(now));
  return true;
}

// Must be defined at module scope, unconditionally, every time this module
// loads — including when the OS relaunches the JS engine specifically to
// run this task with the app not otherwise running. Defining it inside a
// component or behind a conditional means it's simply not registered for
// that relaunch, and the arrival silently does nothing.
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.log("[geofencingTask] error:", error);
    return;
  }
  const { eventType, region } = (data ?? {}) as {
    eventType?: Location.GeofencingEventType;
    region?: Location.LocationRegion;
  };
  if (eventType !== Location.GeofencingEventType.Enter || !region?.identifier) return;

  const decoded = decodeRegionIdentifier(region.identifier);
  if (!decoded) return;

  const allowed = await shouldNotify(decoded.placeId);
  if (!allowed) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: Copy.places.nearbyBannerTitle(decoded.name),
      body: Copy.places.nearbyBannerBody,
      sound: "default",
      data: { url: "pausemoney://decision" },
      ...(Platform.OS === "android" ? { channelId: "checkpoint-alerts" } : null),
    },
    trigger: null,
  });
});

/**
 * Registers OS-level geofences for every watched place, replacing whatever
 * was previously registered. Call this any time the watched-places list
 * changes (add/remove/refresh) so the active geofences always match.
 *
 * Silently does nothing (rather than throwing) when background location
 * permission isn't granted — that's the expected state for anyone who
 * declined it, and useNearbyPlace's foreground-only check still covers
 * them.
 */
export async function syncGeofences(places: WatchedPlace[]): Promise<void> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    const alreadyStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);

    if (status !== "granted" || places.length === 0) {
      if (alreadyStarted) await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      return;
    }

    await Location.startGeofencingAsync(
      GEOFENCE_TASK_NAME,
      places.map((place) => ({
        identifier: encodeRegionIdentifier(place),
        latitude: place.latitude,
        longitude: place.longitude,
        radius: place.radiusMeters,
        notifyOnEnter: true,
        notifyOnExit: false,
      }))
    );
  } catch (e) {
    console.log("[geofencingTask] syncGeofences failed:", e);
  }
}
