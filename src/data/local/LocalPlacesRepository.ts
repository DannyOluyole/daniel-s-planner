import { PlacesRepository } from "@domain/repositories/PlacesRepository";
import { WatchedPlace, WatchedPlaceInput } from "@domain/entities/WatchedPlace";

const DEFAULT_RADIUS_METERS = 150;

/** In-memory stand-in for demo mode — no real geofencing without a device. */
export class LocalPlacesRepository implements PlacesRepository {
  private places: WatchedPlace[] = [];

  async getWatchedPlaces(): Promise<WatchedPlace[]> {
    return this.places;
  }

  async addWatchedPlace(_userId: string, input: WatchedPlaceInput): Promise<WatchedPlace> {
    const place: WatchedPlace = {
      id: `local-${Date.now()}`,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters ?? DEFAULT_RADIUS_METERS,
      createdAt: new Date().toISOString(),
    };
    this.places = [place, ...this.places];
    return place;
  }

  async removeWatchedPlace(_userId: string, id: string): Promise<void> {
    this.places = this.places.filter((p) => p.id !== id);
  }
}
