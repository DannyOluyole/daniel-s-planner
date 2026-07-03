import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/lib/AuthProvider";
import { supabase } from "../../src/lib/supabase";
import { friendlyErrorMessage } from "../../src/lib/errors";
import { MealCard } from "../../src/components/MealCard";
import { colors, radius, spacing } from "../../src/theme";
import { computeGroupStreak, toLocalDateKey } from "../../src/lib/streak";
import type { MealLogWithAuthor, Reaction } from "../../src/lib/types";

const FEED_WINDOW_DAYS = 35;

export default function FeedScreen() {
  const { session, pod } = useAuth();
  const router = useRouter();

  const [meals, setMeals] = useState<MealLogWithAuthor[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!pod) return;
    try {
      const since = new Date();
      since.setDate(since.getDate() - FEED_WINDOW_DAYS);

      const [{ data: mealRows }, { data: memberRows }] = await Promise.all([
        supabase
          .from("meal_logs")
          .select("*, profiles(id, display_name, avatar_color)")
          .eq("pod_id", pod.id)
          .eq("shared_to_pod", true)
          .gte("logged_at", since.toISOString())
          .order("logged_at", { ascending: false }),
        supabase.from("pod_members").select("user_id").eq("pod_id", pod.id),
      ]);

      const mealList = (mealRows as MealLogWithAuthor[]) ?? [];
      setMeals(mealList);
      setMemberIds((memberRows ?? []).map((m) => m.user_id));

      const mealIds = mealList.map((m) => m.id);
      if (mealIds.length > 0) {
        const { data: reactionRows } = await supabase.from("reactions").select("*").in("meal_log_id", mealIds);
        setReactions((reactionRows as Reaction[]) ?? []);
      } else {
        setReactions([]);
      }
      setError(null);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    }
  }, [pod]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFeed().finally(() => setLoading(false));
    }, [loadFeed])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }

  async function toggleReaction(mealId: string) {
    if (!session) return;
    const existing = reactions.find((r) => r.meal_log_id === mealId && r.user_id === session.user.id);
    try {
      if (existing) {
        await supabase.from("reactions").delete().eq("meal_log_id", mealId).eq("user_id", session.user.id);
        setReactions((prev) => prev.filter((r) => !(r.meal_log_id === mealId && r.user_id === session.user.id)));
      } else {
        await supabase.from("reactions").insert({ meal_log_id: mealId, user_id: session.user.id, emoji: "🔥" });
        setReactions((prev) => [
          ...prev,
          { meal_log_id: mealId, user_id: session.user.id, emoji: "🔥", created_at: new Date().toISOString() },
        ]);
      }
    } catch {
      // Reaction taps are low-stakes -- fail silently rather than
      // interrupting the feed with an error banner over a 🔥 tap.
    }
  }

  const loggedDatesByUser: Record<string, string[]> = {};
  for (const meal of meals) {
    const key = toLocalDateKey(meal.logged_at);
    (loggedDatesByUser[meal.user_id] ??= []).push(key);
  }
  const groupStreak = computeGroupStreak(memberIds, loggedDatesByUser);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.podName}>{pod?.name ?? "Your Pod"}</Text>
          <Text style={styles.inviteCode}>Invite code: {pod?.invite_code}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakCount}>{groupStreak}</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.coral} />}
        renderItem={({ item }) => {
          const mealReactions = reactions.filter((r) => r.meal_log_id === item.id);
          const hasReacted = mealReactions.some((r) => r.user_id === session?.user.id);
          return (
            <MealCard
              meal={item}
              reactionCount={mealReactions.length}
              hasReacted={hasReacted}
              onToggleReaction={toggleReaction}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No meals logged yet. Be the first — tap + below.</Text>
            </View>
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push("/log-meal")}>
        <Text style={styles.fabIcon}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cloud,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  podName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
  },
  inviteCode: {
    fontSize: 12,
    color: `${colors.ink}80`,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  streakFlame: {
    fontSize: 16,
  },
  streakCount: {
    fontWeight: "800",
    color: colors.ink,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: `${colors.ember}1A`,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
  },
  errorBannerText: {
    color: colors.ember,
    fontWeight: "600",
    fontSize: 13,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    paddingTop: spacing.xl * 2,
    alignItems: "center",
  },
  emptyText: {
    color: `${colors.ink}66`,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.coral,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: {
    fontSize: 30,
    color: colors.white,
    fontWeight: "700",
    marginTop: -2,
  },
});
