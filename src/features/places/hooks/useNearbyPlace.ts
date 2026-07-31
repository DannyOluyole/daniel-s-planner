import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { WatchedPlace } from "@domain/entities/WatchedPlace";
import { findNearbyPlace } from "@domain/money/proximity";
import { placesRepository } from "@data/repositories";

// Don't re-fetch location more than once every couple of minutes, even if
// Home regains focus repeatedly (e.g. quick tab switching).
const RECHECK_COOLDOWN_MS = 2 * 60 * 1000;
// Once dismissed, don't re-show the same place again for a while — long
// enough to cover the rest of a single shopping trip, short enough to nudge
// again on the next visit.
const DISMISS_COOLDOWN_MS = 2 * 60 * 60 * 1000;
// A cached fix this fresh is plenty precise for a >=100m place radius, and
// using it avoids a slow, battery-heavy fresh GPS fetch on every Home visit.
const MAX_CACHED_AGE_MS = 5 * 60 * 1000;

/**
 * Foreground fallback for whoever hasn't granted (or has since revoked)
 * background location permission: checks the device's last-known (cached)
 * location against watched places whenever Home regains focus. Real arrival
 * detection lives in geofencingTask.ts and fires the instant someone
 * arrives, in the background — this hook only ever catches a nearby place
 * while the app happens to be open, which is the best available fallback
 * for anyone who declined "Allow all the time."
 *
 * Never prompts for permission itself — AddPlaceForm is the one place that
 * asks for it, the first time someone adds a watched place. This hook just
 * quietly does nothing until that's already been granted.
 */
export function useNearbyPlace(userId: string | null) {
  const [nearbyPlace, setNearbyPlace] = useState<WatchedPlace | null>(null);
  const lastCheckedAt = useRef(0);
  const dismissedRef = useRef<{ placeId: string; at: number } | null>(null);

  const check = useCallback(async () => {
    if (!userId) return;
    const now = Date.now();
    if (now - lastCheckedAt.current < RECHECK_COOLDOWN_MS) return;
    lastCheckedAt.current = now;

    try {
      const places = await placesRepository.getWatchedPlaces(userId);
      if (places.length === 0) {
        setNearbyPlace(null);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        setNearbyPlace(null);
        return;
      }

      const position = await Location.getLastKnownPositionAsync({ maxAge: MAX_CACHED_AGE_MS });
      if (!position) {
        setNearbyPlace(null);
        return;
      }

      const match = findNearbyPlace(places, position.coords.latitude, position.coords.longitude);
      const recentlyDismissed =
        match &&
        dismissedRef.current?.placeId === match.id &&
        now - dismissedRef.current.at < DISMISS_COOLDOWN_MS;

      setNearbyPlace(recentlyDismissed ? null : match);
    } catch {
      setNearbyPlace(null);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      check();
    }, [check])
  );

  const dismiss = useCallback(() => {
    setNearbyPlace((current) => {
      if (current) dismissedRef.current = { placeId: current.id, at: Date.now() };
      return null;
    });
  }, []);

  return { nearbyPlace, dismiss };
}
