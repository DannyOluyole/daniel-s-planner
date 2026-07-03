import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import type { MealLogWithAuthor } from "../lib/types";

type Props = {
  meal: MealLogWithAuthor;
  reactionCount: number;
  hasReacted: boolean;
  onToggleReaction: (mealId: string) => void;
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MealCard({ meal, reactionCount, hasReacted, onToggleReaction }: Props) {
  const authorName = meal.profiles?.display_name ?? "Someone";
  const avatarColor = meal.profiles?.avatar_color ?? colors.coral;
  const macros = [
    meal.calories != null ? `${meal.calories} cal` : null,
    meal.protein_g != null ? `${meal.protein_g}g protein` : null,
    meal.carbs_g != null ? `${meal.carbs_g}g carbs` : null,
    meal.fat_g != null ? `${meal.fat_g}g fat` : null,
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.timestamp}>{timeAgo(meal.logged_at)}</Text>
        </View>
      </View>

      {meal.photo_url && <Image source={{ uri: meal.photo_url }} style={styles.photo} />}

      <Text style={styles.mealName}>{meal.name}</Text>
      {macros.length > 0 && <Text style={styles.macros}>{macros.join(" · ")}</Text>}
      {meal.caption && <Text style={styles.caption}>{meal.caption}</Text>}

      <Pressable
        onPress={() => onToggleReaction(meal.id)}
        style={[styles.reactionPill, hasReacted && styles.reactionPillActive]}
      >
        <Text style={styles.reactionText}>🔥 {reactionCount > 0 ? reactionCount : ""}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "800",
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontWeight: "700",
    color: colors.ink,
  },
  timestamp: {
    fontSize: 12,
    color: `${colors.ink}66`,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.cloud,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  macros: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.teal,
  },
  caption: {
    fontSize: 14,
    color: `${colors.ink}CC`,
  },
  reactionPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.cloud,
  },
  reactionPillActive: {
    backgroundColor: `${colors.yellow}55`,
  },
  reactionText: {
    fontWeight: "700",
    fontSize: 13,
  },
});
