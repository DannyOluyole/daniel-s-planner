import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@core/config/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True only while the initial session check is in flight. */
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
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
