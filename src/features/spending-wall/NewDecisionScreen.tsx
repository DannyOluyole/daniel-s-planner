import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Screen } from "@shared/components/Screen";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { useVoiceInput } from "@shared/hooks/useVoiceInput";
import { CATEGORIES, parsePurchaseSpeech } from "@domain/money/parsePurchaseSpeech";
import { QuickAmountKeypad } from "./components/QuickAmountKeypad";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/Navigation";
import type { Category } from "@domain/money/parsePurchaseSpeech";

type Props = NativeStackScreenProps<RootStackParamList, "NewDecision">;

/**
 * The real entry point into a Checkpoint — amount + category, then straight
 * into the Wall. A tappable keypad instead of the OS keyboard, and an
 * optional (not required) merchant name, since the target scenario is
 * someone standing in line with a few seconds to spare, not filling out a
 * form.
 */
export function NewDecisionScreen({ navigation }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [merchant, setMerchant] = useState("");
  const [showMerchantInput, setShowMerchantInput] = useState(false);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const voice = useVoiceInput();

  const amountCents = Math.round((parseFloat(amount || "0") || 0) * 100);
  const canContinue = amountCents > 0;

  // Fills the form as soon as the recognizer settles on a transcript —
  // fields stay editable afterward, voice is a shortcut, not a commitment.
  useEffect(() => {
    if (voice.status !== "idle" || !voice.transcript.trim()) return;
    const parsed = parsePurchaseSpeech(voice.transcript);
    if (parsed.merchant) {
      setMerchant(parsed.merchant);
      setShowMerchantInput(true);
    }
    setCategory(parsed.category);
    if (parsed.amountCents != null) {
      setAmount((parsed.amountCents / 100).toString());
    }
    // Deliberately keyed on voice.status alone — re-running this whenever
    // voice.transcript ticks (interim results) would fight the user's edits.
  }, [voice.status]);

  const inputClass = `rounded-xl2 border px-4 py-3.5 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  const handleContinue = () => {
    navigation.navigate("SpendingWall", {
      amountCents,
      merchant: merchant.trim() || category,
      category,
    });
  };

  return (
    <Screen>
      <View className="mt-4 mb-2">
        <Text className={`text-headline font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
          {Copy.newDecision.title}
        </Text>
      </View>

      <View className="items-center mt-2 mb-1">
        <Text className={`text-[56px] font-extrabold ${dark ? "text-ink-dark" : "text-ink"}`}>
          ${amount || "0"}
        </Text>
      </View>

      <QuickAmountKeypad value={amount} onChange={setAmount} />

      <View className="flex-row flex-wrap gap-2 mt-4">
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={`rounded-full border px-4 py-2 ${
                active ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
              }`}
            >
              <Text
                className={
                  active
                    ? "text-white text-sm font-medium"
                    : dark
                    ? "text-ink-dark text-sm"
                    : "text-ink text-sm"
                }
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        {showMerchantInput ? (
          <TextInput
            className={`${inputClass} flex-1 mr-3`}
            placeholder={Copy.newDecision.merchantPlaceholder}
            placeholderTextColor="#9A9CA5"
            value={merchant}
            onChangeText={setMerchant}
            autoFocus
          />
        ) : (
          <Pressable onPress={() => setShowMerchantInput(true)} hitSlop={8}>
            <Text className={`text-sm font-medium ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
              {Copy.newDecision.addNameCta}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={voice.status === "listening" ? voice.stop : voice.start}
          accessibilityRole="button"
          accessibilityLabel={voice.status === "listening" ? Copy.newDecision.listeningLabel : Copy.newDecision.speakCta}
          className={`rounded-full border py-2 px-3 ${
            voice.status === "listening"
              ? "bg-checkpoint border-checkpoint"
              : dark
              ? "border-hairline-dark"
              : "border-hairline"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              voice.status === "listening" ? "text-white" : dark ? "text-ink-dark" : "text-ink"
            }`}
          >
            {voice.status === "listening" ? Copy.newDecision.listeningLabel : Copy.newDecision.speakCta}
          </Text>
        </Pressable>
      </View>
      {voice.transcript ? (
        <Text className={`mt-2 text-sm ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {Copy.newDecision.voiceHeard(voice.transcript)}
        </Text>
      ) : voice.error ? (
        <Text className="mt-2 text-xs text-signal-caution">{voice.error}</Text>
      ) : null}

      <View className="mt-auto mb-4 gap-3">
        <Button label={Copy.newDecision.continueCta} onPress={handleContinue} disabled={!canContinue} />
        <Button
          label="Cancel"
          intent="ghost"
          onPress={() => {
            // Arriving via a deep link (widget, notification, browser
            // extension) can make this the only screen in the stack —
            // goBack() throws in that case, so fall back to Home.
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("Tabs", { screen: "Home" });
          }}
        />
      </View>
    </Screen>
  );
}
