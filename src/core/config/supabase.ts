import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

// Populate via app.config.ts / EAS secrets — never hardcode in source.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True once real Supabase credentials are set. When false, `src/data/
 * repositories.ts` swaps in local/in-memory repositories and `AuthContext`
 * synthesizes a demo session, so the app is fully click-through-able
 * without a live project.
 */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.warn(
    "[Checkpoint] Supabase env vars are missing — running in local demo mode. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to use a real backend."
  );
}

// The session (including a long-lived refresh token to the user's real
// financial data) belongs in Keychain/Keystore, not AsyncStorage's plain
// on-disk file — SecureStore backs onto both natively. It has no web
// implementation at all, so the web preview target keeps using AsyncStorage
// (matching what native itself used before this change).
const secureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// In demo mode the client is never actually used (LocalCheckpointRepository
// and the synthesized demo session bypass it), but supabase-js throws on an
// empty URL at construction — give it inert placeholders so the module can
// load.
export const supabase = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseAnonKey || "demo-anon-key-not-used",
  {
  auth: {
    storage: Platform.OS === "web" ? AsyncStorage : secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
