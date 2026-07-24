import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { useAuth } from "@core/auth/AuthContext";
import { Copy } from "@core/copy/strings";
import { useWatchedPlaces } from "./hooks/useWatchedPlaces";
import { AddPlaceForm } from "./components/AddPlaceForm";

export function WatchedPlacesScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { places, addPlace, removePlace } = useWatchedPlaces(user?.id ?? null);
  const [adding, setAdding] = useState(false);

  return (
    <Screen>
      <BackHeader title={Copy.places.title} subtitle={Copy.places.subtitle} />

      <Text className={`text-xs mt-1 mb-4 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        {Copy.places.backgroundNote}
      </Text>

      {places.length === 0 && !adding && (
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.places.emptyState}
        </Text>
      )}

      {places.map((place) => (
        <Card key={place.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
                {place.name}
              </Text>
              <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.places.radiusNote(place.radiusMeters)}
              </Text>
            </View>
            <Pressable
              onPress={() => removePlace(place.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`${Copy.places.removeCta} ${place.name}`}
            >
              <Text className="text-xs text-signal-caution">{Copy.places.removeCta}</Text>
            </Pressable>
          </View>
        </Card>
      ))}

      {adding ? (
        <Card>
          <AddPlaceForm
            onSubmit={async (input) => {
              await addPlace(input);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </Card>
      ) : (
        <Button label={Copy.places.addCta} intent="quiet" onPress={() => setAdding(true)} />
      )}
    </Screen>
  );
}
