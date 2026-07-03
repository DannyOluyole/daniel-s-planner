import { useState } from "react";
import { Link } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { supabase } from "../src/lib/supabase";
import { friendlyErrorMessage } from "../src/lib/errors";
import { Button } from "../src/components/Button";
import { TextField } from "../src/components/TextField";
import { colors, spacing } from "../src/theme";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(friendlyErrorMessage(signInError));
      // On success, AuthProvider's onAuthStateChange + AuthGate handle routing.
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Your Pod's been logging without you.</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Sign in" onPress={handleSignIn} loading={loading} disabled={!email || !password} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Pod?</Text>
          <Link href="/sign-up" style={styles.link}>
            Create an account
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cloud,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 15,
    color: `${colors.ink}99`,
    marginTop: -spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.ember,
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerText: {
    color: `${colors.ink}99`,
  },
  link: {
    color: colors.coral,
    fontWeight: "700",
  },
});
