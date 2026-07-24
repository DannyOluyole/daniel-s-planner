import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "checkpoint:has-onboarded";

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === "true";
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, "true");
}

// Exposed for a future "replay intro" option in Settings.
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
