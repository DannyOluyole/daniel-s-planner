import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Pod, Profile } from "./types";

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  pod: Pod | null;
  refreshPod: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pod, setPod] = useState<Pod | null>(null);

  async function loadProfileAndPod(userId: string) {
    const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(profileRow ?? null);

    // v1: a user belongs to at most one Pod; use the first membership found.
    const { data: membership } = await supabase
      .from("pod_members")
      .select("pod_id, pods(*)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    setPod((membership?.pods as unknown as Pod) ?? null);
  }

  async function refreshPod() {
    if (session?.user.id) {
      await loadProfileAndPod(session.user.id);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) {
        await loadProfileAndPod(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user.id) {
        await loadProfileAndPod(newSession.user.id);
      } else {
        setProfile(null);
        setPod(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, profile, pod, refreshPod }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
