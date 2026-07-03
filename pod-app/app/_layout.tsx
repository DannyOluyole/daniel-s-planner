import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/lib/AuthProvider";
import { colors } from "../src/theme";

function AuthGate() {
  const { loading, session, pod } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const atRoot = segments[0] === undefined;
    const inAuthScreen = segments[0] === "sign-in" || segments[0] === "sign-up";
    const inOnboarding = segments[0] === "onboarding";

    if (!session && !inAuthScreen) {
      router.replace("/sign-in");
    } else if (session && !pod && !inOnboarding) {
      router.replace("/onboarding");
    } else if (session && pod && (atRoot || inAuthScreen || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [loading, session, pod, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="log-meal"
        options={{ presentation: "modal", headerShown: true, title: "Log a meal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cloud,
  },
});
