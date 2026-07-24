import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from "react-native";
import { Screen } from "@shared/components/Screen";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { useTheme } from "@core/theme/ThemeContext";
import { onboardingSlides } from "./slides";
import { OnboardingSlideView } from "./components/OnboardingSlideView";
import { OnboardingDots } from "./components/OnboardingDots";
import { SavingsGoalForm } from "./components/SavingsGoalForm";
import { FutureVisionForm } from "./components/FutureVisionForm";
import { AddCommitmentForm } from "@features/home/components/AddCommitmentForm";
import { useOnboarding } from "./OnboardingContext";
import { useAuth } from "@core/auth/AuthContext";
import { useSavingsGoals } from "@shared/hooks/useSavingsGoals";
import { useCommitments } from "@shared/hooks/useCommitments";
import { useFutureVision } from "@shared/hooks/useFutureVision";

type Step = "slides" | "responsibilities" | "habits" | "vision" | "goal";

export function OnboardingScreen() {
  const { complete } = useOnboarding();
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { addGoal } = useSavingsGoals(user?.id ?? null);
  const { addCommitment } = useCommitments(user?.id ?? null);
  const { setVision } = useFutureVision(user?.id ?? null);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("slides");
  const scrollRef = useRef<ScrollView>(null);
  const isLast = index === onboardingSlides.length - 1;
  // Read live, not captured once at module load — see OnboardingSlideView
  // for why a frozen Dimensions.get() snapshot broke paging on-device.
  const { width } = useWindowDimensions();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const goNext = () => {
    if (isLast) {
      setStep("responsibilities");
      return;
    }
    // Update index immediately rather than waiting on onMomentumScrollEnd —
    // Android doesn't reliably fire that event for a programmatic scrollTo
    // (only for real drag gestures), so waiting on it left `index` stuck
    // a page behind and made every other Continue tap a no-op.
    const next = index + 1;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: width * next, animated: true });
  };

  if (step === "responsibilities" || step === "habits") {
    const isResponsibilities = step === "responsibilities";
    const copy = isResponsibilities ? Copy.onboardingResponsibilities : Copy.onboardingHabits;
    return (
      <Screen>
        <View className="flex-1 justify-center px-2">
          <Text className={`text-title font-semibold mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
            {copy.title}
          </Text>
          <Text className={`text-base mb-6 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
            {copy.subtitle}
          </Text>
          <AddCommitmentForm
            type={isResponsibilities ? "fixed" : "variable"}
            onSubmit={async (name, amountCents, category) => {
              await addCommitment({ name, type: isResponsibilities ? "fixed" : "variable", amountCents, category });
              setStep(isResponsibilities ? "habits" : "vision");
            }}
            // "Cancel" doubles as "skip" here — there's nothing to cancel
            // back to, just moving on without adding one right now.
            onCancel={() => setStep(isResponsibilities ? "habits" : "vision")}
          />
        </View>
      </Screen>
    );
  }

  if (step === "vision") {
    return (
      <Screen>
        <View className="flex-1 justify-center px-2">
          <FutureVisionForm
            onSubmit={async (text) => {
              await setVision(text);
              setStep("goal");
            }}
            onSkip={() => setStep("goal")}
          />
        </View>
      </Screen>
    );
  }

  if (step === "goal") {
    return (
      <Screen>
        <View className="flex-1 justify-center px-2">
          <SavingsGoalForm
            submitLabel="Get started"
            onSubmit={async (input) => {
              await addGoal(input);
              complete();
            }}
            onSkip={complete}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="flex-1"
      >
        {onboardingSlides.map((slide) => (
          <OnboardingSlideView key={slide.key} slide={slide} />
        ))}
      </ScrollView>

      <View className="px-8 pb-4">
        <OnboardingDots count={onboardingSlides.length} activeIndex={index} />
        <View className="mt-6 gap-3">
          <Button label={isLast ? "Get started" : "Continue"} onPress={goNext} />
          {!isLast && <Button label="Skip" intent="ghost" onPress={() => setStep("responsibilities")} />}
        </View>
      </View>
    </Screen>
  );
}
