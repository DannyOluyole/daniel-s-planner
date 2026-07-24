import "./global.css";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Navigation } from "@app/Navigation";
import { ThemeProvider, useTheme } from "@core/theme/ThemeContext";
import { AuthProvider, useAuth } from "@core/auth/AuthContext";
import { OnboardingProvider, useOnboarding } from "@features/onboarding/OnboardingContext";
import { OnboardingScreen } from "@features/onboarding/OnboardingScreen";
import { AuthScreen } from "@features/auth/AuthScreen";
import { PortalScreen } from "@features/portal/PortalScreen";
import { syncGeofences } from "@features/places/geofencing";

// Without a handler, expo-notifications silently drops any notification
// received while the app is in the foreground — this is documented default
// behavior, not a bug on its own, but combined with the missing Android
// channel below it meant check-ins and geofence alerts could go
// completely unseen depending on whether the app happened to be open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function Root() {
  const { scheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { ready: onboardingReady, onboarded } = useOnboarding();
  // Lives in memory, not storage — a real relaunch gets a fresh Root mount
  // and sees the Portal again; backgrounding/foregrounding the app doesn't,
  // since the JS state survives. That's "once per session."
  const [hasEnteredPortal, setHasEnteredPortal] = useState(false);

  // Arriving via a one-tap entry point (widget, Action Button, extension —
  // anything that deep-links to a specific screen) skips the Portal:
  // someone who tapped "decide now" shouldn't hit a second front door.
  const url = Linking.useURL();
  const cameViaDeepLink = !!url && !!Linking.parse(url).path;

  // Android 8+ silently drops any notification with no channel — there was
  // no channel configured anywhere in this app, which is the likely reason
  // scheduled check-ins and geofence arrival alerts weren't showing up at
  // all, regardless of the foreground handler above.
  //
  // Channel id deliberately isn't "default": a channel's settings (sound
  // included) are locked in by Android the moment it's first created and
  // can never be changed afterward, even by calling this again with a
  // different config — only creating a new channel id picks up a change
  // like adding `sound` below. Devices that already got the old "default"
  // channel (silently missing a sound) need this new id to actually hear
  // anything; bumping the id is the only way to fix that after the fact.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    Notifications.setNotificationChannelAsync("checkpoint-alerts", {
      name: "Checkpoint",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }, []);

  // A geofence arrival notification carries its own deep link (data.url)
  // rather than just opening the app to wherever it was — tapping it should
  // land on Decision Mode the same as every other one-tap entry point.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const notificationUrl = response.notification.request.content.data?.url;
      if (typeof notificationUrl === "string") {
        Linking.openURL(notificationUrl);
      }
    });
    return () => subscription.remove();
  }, []);

  // Safety net: re-registers geofences on every fresh launch, in case the OS
  // cleared them (e.g. after a reboot). No-ops immediately if the user has
  // no watched places, so this never prompts for location permission on its
  // own — only once they've actually added a place.
  useEffect(() => {
    if (user?.id) syncGeofences(user.id);
  }, [user?.id]);

  const spinner = (
    <View
      className={`flex-1 items-center justify-center ${
        scheme === "dark" ? "bg-canvas-dark" : "bg-canvas"
      }`}
    >
      <ActivityIndicator color="#2F5D50" />
    </View>
  );

  // Auth resolves first: no point checking onboarding for a signed-out user.
  if (authLoading) return spinner;
  if (!user) return <AuthScreen />;

  if (!onboardingReady) return spinner;

  // onboarded flips instantly via OnboardingContext.replay() (e.g. from
  // Settings), so this re-renders straight into onboarding with no relaunch.
  if (!onboarded) return <OnboardingScreen />;

  if (!hasEnteredPortal && !cameViaDeepLink) {
    return <PortalScreen onEnter={() => setHasEnteredPortal(true)} />;
  }

  return <Navigation />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <StatusBar style="auto" />
            <Root />
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
