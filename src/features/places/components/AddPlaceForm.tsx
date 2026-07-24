import React, { useCallback, useState } from "react";
import { View, Text, TextInput } from "react-native";
import * as Location from "expo-location";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { WatchedPlaceInput } from "@domain/entities/WatchedPlace";

interface Props {
  onSubmit: (input: WatchedPlaceInput) => Promise<void>;
  onCancel: () => void;
}

type Phase = "locating" | "naming" | "saving" | "denied" | "error";

const LOCATE_TIMEOUT_MS = 20000;
// A cached fix this fresh is plenty precise for a ~150m geofence radius,
// and returning it is near-instant versus waiting on a new GPS fetch.
const MAX_CACHED_AGE_MS = 5 * 60 * 1000;

/** Turns a reverse-geocoded address into a short, human name — prefers a
 * named feature/POI when the platform's geocoder supplies one (Android
 * sometimes does), falling back to a street + city combo, since neither
 * platform reliably resolves business names without a paid Places API. */
function guessPlaceName(address: Location.LocationGeocodedAddress | null): string {
  if (!address) return "";
  if (address.name && address.name !== address.streetNumber) return address.name;
  return [address.street, address.city].filter(Boolean).join(", ");
}

export function AddPlaceForm({ onSubmit, onCancel }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [phase, setPhase] = useState<Phase>("locating");
  const [name, setName] = useState("");
  const [detected, setDetected] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const locate = useCallback(async () => {
    setPhase("locating");

    // One timeout guarding the whole sequence — permission request, cached
    // lookup, and fresh GPS fetch can each independently hang, and a
    // per-call timeout that misses one of them (as an earlier version of
    // this did for getLastKnownPositionAsync) still leaves the screen stuck
    // forever with no feedback.
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      setPhase("error");
    }, LOCATE_TIMEOUT_MS);

    // Reverse geocoding is best-effort — a slow or failing lookup should
    // never block the user from naming the place themselves, it just means
    // the input starts blank instead of pre-filled.
    const resolveNameAndFinish = async (point: { latitude: number; longitude: number }) => {
      setCoords(point);
      try {
        const [address] = await Location.reverseGeocodeAsync(point);
        if (timedOut) return;
        const guess = guessPlaceName(address ?? null);
        if (guess) {
          setName(guess);
          setDetected(true);
        }
      } catch (e) {
        console.log("[AddPlaceForm] reverse geocode failed:", e);
      }
      if (!timedOut) setPhase("naming");
    };

    try {
      console.log("[AddPlaceForm] requesting foreground permission…");
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("[AddPlaceForm] permission result:", status);
      if (timedOut) return;
      if (status !== "granted") {
        setPhase("denied");
        return;
      }

      console.log("[AddPlaceForm] checking cached position…");
      const cached = await Location.getLastKnownPositionAsync({ maxAge: MAX_CACHED_AGE_MS });
      console.log("[AddPlaceForm] cached position:", cached);
      if (timedOut) return;

      if (cached) {
        await resolveNameAndFinish({ latitude: cached.coords.latitude, longitude: cached.coords.longitude });
        return;
      }

      console.log("[AddPlaceForm] fetching fresh position…");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log("[AddPlaceForm] fresh position:", position);
      if (timedOut) return;
      await resolveNameAndFinish({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (e) {
      console.log("[AddPlaceForm] error:", e);
      if (!timedOut) setPhase("error");
    } finally {
      clearTimeout(timer);
    }
  }, []);

  React.useEffect(() => {
    locate();
  }, [locate]);

  const handleSave = async () => {
    if (!coords || !name.trim()) return;
    setPhase("saving");
    try {
      await onSubmit({ name: name.trim(), latitude: coords.latitude, longitude: coords.longitude });
    } finally {
      setPhase("naming");
    }
  };

  const inputClass = `rounded-xl2 border px-4 py-3 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  if (phase === "locating" || phase === "saving") {
    return (
      <View className="mt-3">
        <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {Copy.places.savingLabel}
        </Text>
      </View>
    );
  }

  if (phase === "denied") {
    return (
      <View className="mt-3">
        <Text className="text-sm text-signal-caution mb-3">{Copy.places.permissionDeniedNote}</Text>
        <Button label={Copy.places.cancelCta} intent="ghost" onPress={onCancel} />
      </View>
    );
  }

  if (phase === "error") {
    return (
      <View className="mt-3">
        <Text className="text-sm text-signal-caution mb-3">
          Couldn't get your location — make sure location services are on and you have a clear view of
          the sky (GPS is slow or unavailable indoors), then try again.
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Try again" onPress={locate} />
          </View>
          <View className="flex-1">
            <Button label={Copy.places.cancelCta} intent="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3 mt-3">
      <Text className={`text-sm ${dark ? "text-ink-soft" : "text-ink-soft"}`}>
        {detected ? Copy.places.detectedPlaceLabel : Copy.places.detectedPlaceFallbackLabel}
      </Text>
      <TextInput
        className={inputClass}
        placeholder={Copy.places.namePlaceholder}
        placeholderTextColor="#9A9CA5"
        value={name}
        onChangeText={setName}
        autoFocus={!detected}
        selectTextOnFocus
      />
      <View className="flex-row gap-2 mt-1">
        <View className="flex-1">
          <Button label={Copy.places.saveCta} onPress={handleSave} disabled={!name.trim()} />
        </View>
        <View className="flex-1">
          <Button label={Copy.places.cancelCta} intent="ghost" onPress={onCancel} />
        </View>
      </View>
    </View>
  );
}
