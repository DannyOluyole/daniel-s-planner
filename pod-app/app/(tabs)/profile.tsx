import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/lib/AuthProvider";
import { supabase } from "../../src/lib/supabase";
import { friendlyErrorMessage } from "../../src/lib/errors";
import { Button } from "../../src/components/Button";
import { colors, radius, spacing } from "../../src/theme";
import { computeStreak, toLocalDateKey } from "../../src/lib/streak";

export default function ProfileScreen() {
  const { session, profile, pod } = useAuth();
  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        if (!session) return;
        try {
          const since = new Date();
          since.setDate(since.getDate() - 35);
          const { data, count } = await supabase
            .from("meal_logs")
            .select("logged_at", { count: "exact" })
            .eq("user_id", session.user.id)
            .gte("logged_at", since.toISOString());
          if (cancelled) return;
          const dateKeys = (data ?? []).map((r) => toLocalDateKey(r.logged_at));
          setStreak(computeStreak(dateKeys));
          setTotalLogs(count ?? 0);
          setError(null);
        } catch (err) {
          if (!cancelled) setError(friendlyErrorMessage(err));
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [session])
  );

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: profile?.avatar_color ?? colors.coral }]}>
        <Text style={styles.avatarText}>{(profile?.display_name ?? "?").charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{profile?.display_name}</Text>
      <Text style={styles.podLine}>Pod: {pod?.name}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalLogs}</Text>
          <Text style={styles.statLabel}>meals logged (35d)</Text>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cloud,
    alignItems: "center",
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.sm,
  },
  podLine: {
    color: `${colors.ink}80`,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.xl,
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
  },
  statLabel: {
    fontSize: 12,
    color: `${colors.ink}80`,
  },
  error: {
    color: colors.ember,
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
