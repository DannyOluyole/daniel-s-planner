import { WatchedPlace, WatchedPlaceInput } from "@domain/entities/WatchedPlace";

export interface PlacesRepository {
  getWatchedPlaces(userId: string): Promise<WatchedPlace[]>;
  addWatchedPlace(userId: string, input: WatchedPlaceInput): Promise<WatchedPlace>;
  removeWatchedPlace(userId: string, id: string): Promise<void>;
  /** See CheckpointRepository.clearAllData — same local-mode-only contract. */
  clearAllData?(userId: string): Promise<void>;
}
