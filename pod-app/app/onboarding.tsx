import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "../src/lib/supabase";
import { friendlyErrorMessage } from "../src/lib/errors";
import { useAuth } from "../src/lib/AuthProvider";
import { Button } from "../src/components/Button";
import { TextField } from "../src/components/TextField";
import { colors, radius, spacing } from "../src/theme";

type Mode = "create" | "join";

export default function OnboardingScreen() {
  const { session, refreshPod } = useAuth();
  const [mode, setMode] = useState<Mode>("create");
  const [podName, setPodName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const { error: createError } = await supabase.rpc("create_pod", { p_name: podName.trim() });

      if (createError) {
        setError(friendlyErrorMessage(createError));
        return;
      }
      await refreshPod();
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const code = inviteCode.trim().toUpperCase();
      const { error: joinError } = await supabase.rpc("join_pod", { p_invite_code: code });

      if (joinError) {
        if (joinError.message.includes("No Pod found")) {
          setError("No Pod found with that code. Double-check it with whoever invited you.");
        } else if (joinError.message.includes("full")) {
          setError("This Pod is already full (8 members max).");
        } else {
          setError(friendlyErrorMessage(joinError));
        }
        return;
      }
      await refreshPod();
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grab 2 friends.{"\n"}Unlock everything.</Text>
      <Text style={styles.subtitle}>
        Pod only works with your people in it — create a Pod and invite them, or join one with a code.
      </Text>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setMode("create")}
          style={[styles.tab, mode === "create" && styles.tabActive]}
        >
          <Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>Create a Pod</Text>
        </Pressable>
        <Pressable onPress={() => setMode("join")} style={[styles.tab, mode === "join" && styles.tabActive]}>
          <Text style={[styles.tabText, mode === "join" && styles.tabTextActive]}>Join a Pod</Text>
        </Pressable>
      </View>

      {mode === "create" ? (
        <View style={styles.form}>
          <TextField
            label="Pod name"
            placeholder="e.g. The Snack Pack"
            value={podName}
            onChangeText={setPodName}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Create Pod" onPress={handleCreate} loading={loading} disabled={!podName.trim()} />
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            label="Invite code"
            placeholder="e.g. 4F9K2X"
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Join Pod" onPress={handleJoin} loading={loading} disabled={!inviteCode.trim()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cloud,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 15,
    color: `${colors.ink}99`,
    marginTop: -spacing.md,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: `${colors.ink}0D`,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontWeight: "600",
    color: `${colors.ink}80`,
  },
  tabTextActive: {
    color: colors.ink,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.ember,
    fontWeight: "600",
    fontSize: 14,
  },
});
