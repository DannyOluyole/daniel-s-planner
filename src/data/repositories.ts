import { supabaseConfigured } from "@core/config/supabase";
import { CheckpointRepository } from "@domain/repositories/CheckpointRepository";
import { BankLinkRepository } from "@domain/repositories/BankLinkRepository";
import { PlacesRepository } from "@domain/repositories/PlacesRepository";
import { SupabaseCheckpointRepository } from "./supabase/SupabaseCheckpointRepository";
import { SupabasePlaidRepository } from "./plaid/SupabasePlaidRepository";
import { SupabasePlacesRepository } from "./supabase/SupabasePlacesRepository";
import { LocalCheckpointRepository } from "./local/LocalCheckpointRepository";
import { LocalBankLinkRepository } from "./local/LocalBankLinkRepository";
import { LocalPlacesRepository } from "./local/LocalPlacesRepository";

/**
 * Single seam for swapping data sources app-wide (mirrors the pattern each
 * hook used to implement individually). Every hook imports these instead of
 * instantiating its own repository. Flip `supabaseConfigured` (by setting
 * EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY) and everything below switches with it.
 */
export const checkpointRepository: CheckpointRepository = supabaseConfigured
  ? new SupabaseCheckpointRepository()
  : new LocalCheckpointRepository();

export const bankLinkRepository: BankLinkRepository = supabaseConfigured
  ? new SupabasePlaidRepository()
  : new LocalBankLinkRepository();

export const placesRepository: PlacesRepository = supabaseConfigured
  ? new SupabasePlacesRepository()
  : new LocalPlacesRepository();
