import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@core/config/supabase";
import { checkpointRepository, placesRepository } from "@data/repositories";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True only while the initial session check is in flight. */
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Permanently deletes the signed-in user's account and all their data
   * (cascades server-side — see migration 0015), then signs out locally. */
  deleteAccount: () => Promise<{ error: string | null }>;
  /** Wipes every decision, goal, commitment, income source, watched place,
   * and bank connection for the signed-in user, but keeps the account and
   * session — a "start over" distinct from deleteAccount. */
  clearData: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Stable id so LocalCheckpointRepository/LocalBankLinkRepository always
// resolve back to the same in-memory record across a demo session.
const LOCAL_DEMO_SESSION = {
  user: { id: "local-demo-user", email: "demo@checkpoint.local" },
} as Session;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(
    supabaseConfigured ? null : LOCAL_DEMO_SESSION
  );
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    // Local demo mode: session is synthesized above, no network involved,
    // and there's nothing to subscribe to.
    if (!supabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabaseConfigured) return { error: null };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!supabaseConfigured) return { error: null };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (!supabaseConfigured) return; // nothing to sign out of in demo mode
    await supabase.auth.signOut();
  };

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    if (!supabaseConfigured || !session?.user) return { error: null }; // nothing to delete in demo mode
    try {
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { userId: session.user.id },
      });
      if (error) return { error: error.message };
      await supabase.auth.signOut();
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message ?? "Something went wrong." };
    }
  };

  const clearData = async (): Promise<{ error: string | null }> => {
    const userId = session?.user?.id;
    if (!userId) return { error: null };

    if (!supabaseConfigured) {
      // Local demo mode: reset the in-memory repositories directly instead
      // of calling an edge function. LocalBankLinkRepository has nothing to
      // clear — it never holds a real connection in demo mode.
      await Promise.all([
        checkpointRepository.clearAllData?.(userId),
        placesRepository.clearAllData?.(userId),
      ]);
      return { error: null };
    }

    try {
      const { error } = await supabase.functions.invoke("clear-data", {
        body: { userId },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message ?? "Something went wrong." };
    }
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      deleteAccount,
      clearData,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
