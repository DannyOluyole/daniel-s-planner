import { useCallback, useEffect, useState } from "react";
import { WatchedPlace, WatchedPlaceInput } from "@domain/entities/WatchedPlace";
import { placesRepository } from "@data/repositories";
import { syncGeofences } from "../geofencing";

export function useWatchedPlaces(userId: string | null) {
  const [places, setPlaces] = useState<WatchedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await placesRepository.getWatchedPlaces(userId);
      setPlaces(next);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPlace = useCallback(
    async (input: WatchedPlaceInput) => {
      if (!userId) return;
      await placesRepository.addWatchedPlace(userId, input);
      await refresh();
      await syncGeofences(userId);
    },
    [userId, refresh]
  );

  const removePlace = useCallback(
    async (id: string) => {
      if (!userId) return;
      await placesRepository.removeWatchedPlace(userId, id);
      await refresh();
      await syncGeofences(userId);
    },
    [userId, refresh]
  );

  return { places, loading, addPlace, removePlace, refresh };
}
