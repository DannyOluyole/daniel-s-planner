/**
 * A place the user manually marked for a quiet check-in nudge when they're
 * nearby — a mall, a usual coffee shop. Never sourced from a places
 * directory; always the device's own coordinates at the moment it was
 * added.
 */
export interface WatchedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}

export interface WatchedPlaceInput {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}
