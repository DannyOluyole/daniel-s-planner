import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Screen } from "@shared/components/Screen";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { useAuth } from "@core/auth/AuthContext";
import { Copy } from "@core/copy/strings";

export function AuthScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignIn = mode === "signIn";

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const timeout = new Promise<{ error: string | null }>((resolve) =>
        setTimeout(() => resolve({ error: "Request timed out after 15s — check your connection." }), 15000)
      );
      const request = isSignIn
        ? signInWithPassword(email.trim(), password)
        : signUpWithPassword(email.trim(), password);
      const result = await Promise.race([request, timeout]);
      if (result.error) setError(result.error);
    } catch (e) {
      setError((e as Error).message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `rounded-xl2 border px-4 py-3.5 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;
  const placeholderColor = dark ? "#9A9CA5" : "#9A9CA5";

  return (
    <Screen>
      <View className="flex-1 justify-center px-2">
        <Text className={`text-title font-semibold mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {isSignIn ? Copy.auth.signInTitle : Copy.auth.signUpTitle}
        </Text>
        <Text className={`text-base mb-8 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {isSignIn ? Copy.auth.signInSubtitle : Copy.auth.signUpSubtitle}
        </Text>

        <View className="gap-3">
          <TextInput
            className={inputClass}
            placeholder={Copy.auth.emailPlaceholder}
            placeholderTextColor={placeholderColor}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <View className="flex-row items-center">
            <TextInput
              className={`${inputClass} flex-1`}
              placeholder={Copy.auth.passwordPlaceholder}
              placeholderTextColor={placeholderColor}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              className="absolute right-4"
              hitSlop={12}
            >
              <Text className={`text-sm font-medium ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <Text className="mt-3 text-sm text-signal-caution">{error}</Text>
        )}

        <View className="mt-6">
          <Button
            label={isSignIn ? Copy.auth.signInCta : Copy.auth.signUpCta}
            onPress={handleSubmit}
            loading={loading}
            disabled={!email.trim() || !password}
          />
          <View className="mt-3">
            <Button
              label={isSignIn ? Copy.auth.switchToSignUp : Copy.auth.switchToSignIn}
              intent="ghost"
              onPress={() => {
                setError(null);
                setMode(isSignIn ? "signUp" : "signIn");
              }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
