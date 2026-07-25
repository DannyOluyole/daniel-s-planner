import { WatchedPlace } from "@domain/entities/WatchedPlace";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in meters (haversine). */
export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * The closest watched place the given coordinate currently falls within, or
 * null if none. When more than one place's radius overlaps the current
 * position, the nearest one wins rather than whichever happens to be first
 * in the list.
 */
export function findNearbyPlace(
  places: WatchedPlace[],
  latitude: number,
  longitude: number
): WatchedPlace | null {
  let nearest: WatchedPlace | null = null;
  let nearestDistance = Infinity;
  for (const place of places) {
    const d = distanceMeters(latitude, longitude, place.latitude, place.longitude);
    if (d <= place.radiusMeters && d < nearestDistance) {
      nearest = place;
      nearestDistance = d;
    }
  }
  return nearest;
}
