import React, { useState } from "react";
import { Platform, View, Text, TextInput, Share } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { colors } from "@core/theme/tokens";
import { useAuth } from "@core/auth/AuthContext";
import { useReferrals } from "@shared/hooks/useReferrals";
import { Copy } from "@core/copy/strings";
import { supabaseConfigured } from "@core/config/supabase";
import type { SettingsStackScreenProps } from "@app/Navigation";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

type Props = SettingsStackScreenProps<"Referral">;

/**
 * "Your code" is always redeemable by someone else. Redeeming a friend's
 * code — the "Have a friend's code?" field below — is a separate action
 * gated one level deeper so a stray deep-link tap can't silently link an
 * account; the code lands prefilled, but redeeming is still a deliberate
 * button press.
 */
export function ReferralScreen({ route }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { summary, loading, redeem } = useReferrals(user?.id ?? null);
  const [codeInput, setCodeInput] = useState(route.params?.code ?? "");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const handleShare = () => {
    if (!summary) return;
    Share.share({ message: Copy.referrals.shareMessage(summary.code) }).catch(() => {});
  };

  const handleRedeem = async () => {
    const trimmed = codeInput.trim();
    if (!trimmed || redeeming) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const result = await redeem(trimmed);
      if (result.ok) {
        setRedeemMessage({ tone: "success", text: Copy.referrals.redeemSuccess(result.premiumDaysEarned) });
        setCodeInput("");
      } else {
        const text =
          result.error === "invalid_code"
            ? Copy.referrals.redeemErrorInvalidCode
            : result.error === "self_referral"
            ? Copy.referrals.redeemErrorSelfReferral
            : result.error === "already_used"
            ? Copy.referrals.redeemErrorAlreadyUsed
            : result.error === "unavailable"
            ? Copy.referrals.redeemErrorUnavailable
            : Copy.referrals.redeemErrorUnknown;
        setRedeemMessage({ tone: "error", text });
      }
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Screen>
      <BackHeader title={Copy.referrals.title} subtitle={Copy.referrals.subtitle} />

      {!supabaseConfigured && (
        <Text className={`text-xs mb-4 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.referrals.demoNote}
        </Text>
      )}

      <Card>
        <Text className={`text-xs uppercase tracking-wide mb-2 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.referrals.yourCodeLabel}
        </Text>
        <Text
          style={{ fontFamily: MONO }}
          className={`text-3xl font-bold tracking-[6px] mb-4 ${dark ? "text-ink-dark" : "text-ink"}`}
        >
          {loading || !summary ? "······" : summary.code}
        </Text>
        <Button label={Copy.referrals.shareCta} onPress={handleShare} disabled={!summary} />
      </Card>

      <View className="flex-row mt-4" style={{ gap: 12 }}>
        <Card className="flex-1">
          <Text className={`text-2xl font-bold ${dark ? "text-ink-dark" : "text-ink"}`}>
            {summary?.invitesSent ?? 0}
          </Text>
          <Text className={`text-xs mt-1 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.referrals.invitesSentLabel(summary?.invitesSent ?? 0)}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className={`text-2xl font-bold ${dark ? "text-ink-dark" : "text-ink"}`}>
            {summary?.premiumDaysEarned ?? 0}
          </Text>
          <Text className={`text-xs mt-1 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.referrals.daysBankedLabel(summary?.premiumDaysEarned ?? 0)}
          </Text>
        </Card>
      </View>
      <Text className={`text-xs mt-2 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        {Copy.referrals.daysBankedNote}
      </Text>

      <Card className="mt-4">
        <Text className={`text-headline mb-3 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {Copy.referrals.enterCodeLabel}
        </Text>
        <TextInput
          value={codeInput}
          onChangeText={(next) => {
            setCodeInput(next.toUpperCase());
            setRedeemMessage(null);
          }}
          placeholder={Copy.referrals.enterCodePlaceholder}
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="characters"
          autoCorrect={false}
          className={`rounded-xl2 border px-4 py-3 mb-3 text-base ${
            dark ? "border-hairline-dark text-ink-dark" : "border-hairline text-ink"
          }`}
        />
        {redeemMessage && (
          <Text
            className={`text-sm mb-3 ${redeemMessage.tone === "success" ? "text-checkpoint-bright" : "text-signal-caution"}`}
          >
            {redeemMessage.text}
          </Text>
        )}
        <Button
          label={Copy.referrals.redeemCta}
          intent="quiet"
          loading={redeeming}
          disabled={!codeInput.trim()}
          onPress={handleRedeem}
        />
      </Card>
    </Screen>
  );
}
