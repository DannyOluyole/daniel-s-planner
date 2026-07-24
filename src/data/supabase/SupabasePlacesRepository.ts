import { supabase } from "@core/config/supabase";
import { PlacesRepository } from "@domain/repositories/PlacesRepository";
import { WatchedPlace, WatchedPlaceInput } from "@domain/entities/WatchedPlace";

const DEFAULT_RADIUS_METERS = 150;

export class SupabasePlacesRepository implements PlacesRepository {
  async getWatchedPlaces(userId: string): Promise<WatchedPlace[]> {
    const { data, error } = await supabase
      .from("watched_places")
      .select("id, name, latitude, longitude, radius_meters, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      radiusMeters: row.radius_meters as number,
      createdAt: row.created_at as string,
    }));
  }

  async addWatchedPlace(userId: string, input: WatchedPlaceInput): Promise<WatchedPlace> {
    const { data, error } = await supabase
      .from("watched_places")
      .insert({
        user_id: userId,
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
        radius_meters: input.radiusMeters ?? DEFAULT_RADIUS_METERS,
      })
      .select("id, name, latitude, longitude, radius_meters, created_at")
      .single();

    if (error) throw error;
    return {
      id: data.id as string,
      name: data.name as string,
      latitude: data.latitude as number,
      longitude: data.longitude as number,
      radiusMeters: data.radius_meters as number,
      createdAt: data.created_at as string,
    };
  }

  async removeWatchedPlace(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from("watched_places").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
  }
}
