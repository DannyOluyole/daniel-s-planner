import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Copy } from "@core/copy/strings";
import { placesRepository } from "@data/repositories";
import { WatchedPlace } from "@domain/entities/WatchedPlace";

export const GEOFENCE_TASK = "checkpoint-geofence-task";
const NAME_MAP_KEY = "checkpoint:geofence-names";

/**
 * Registered once at app startup (see index.js). Runs in a headless
 * context — no React tree, no navigation — so it can only fire a
 * notification; opening Decision Mode from it happens the same way as
 * every other one-tap entry point, via the checkpoint:// deep link, once
 * the user taps that notification.
 *
 * expo-task-manager isn't supported on web — this module is only ever
 * imported conditionally there (see index.js), but syncGeofences below is
 * also imported directly by App.tsx for the startup safety-net call, so
 * the defineTask side effect itself stays guarded rather than relying
 * solely on callers to avoid importing this file on web.
 */
if (Platform.OS !== "web") {
  TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };
    if (eventType !== Location.GeofencingEventType.Enter) return;

    const raw = await AsyncStorage.getItem(NAME_MAP_KEY);
    const names: Record<string, string> = raw ? JSON.parse(raw) : {};
    const placeName = names[region.identifier ?? ""] ?? "a place you're watching";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: Copy.places.arrivalNotificationTitle(placeName),
        body: Copy.places.arrivalNotificationBody,
        data: { url: "checkpoint://decision" },
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "checkpoint-alerts" } : null),
      },
      trigger: null,
    });
  });
}

/**
 * Re-registers the full geofence set from whatever's currently saved.
 * Call this after adding/removing a place, and once at app startup as a
 * safety net. Requests background location permission on first use —
 * quietly does nothing if it's denied, leaving places saved for whenever
 * permission is eventually granted.
 */
export async function syncGeofences(userId: string): Promise<void> {
  if (Platform.OS === "web") return;

  const places = await placesRepository.getWatchedPlaces(userId);

  if (places.length === 0) {
    const hasStarted = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if (hasStarted) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }

  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== "granted") return;
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== "granted") return;

  const names: Record<string, string> = {};
  const regions: Location.LocationRegion[] = places.map((place: WatchedPlace) => {
    names[place.id] = place.name;
    return {
      identifier: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
      radius: place.radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: false,
    };
  });
  await AsyncStorage.setItem(NAME_MAP_KEY, JSON.stringify(names));

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}
