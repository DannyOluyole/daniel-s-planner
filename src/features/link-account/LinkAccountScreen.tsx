import React, { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { useAuth } from "@core/auth/AuthContext";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { humanizeCategory } from "@domain/money/humanizeCategory";
import { usePlaidLink } from "./hooks/usePlaidLink";
import { useBankConnectionStatus } from "./hooks/useBankConnectionStatus";
import { useTransactions } from "./hooks/useTransactions";
import { refreshCheckpointWidget } from "@features/widget/widgetTaskHandler";

const phaseLabel: Record<string, string> = {
  fetchingToken: Copy.linkAccount.syncingLabel,
  linking: Copy.linkAccount.syncingLabel,
  exchanging: Copy.linkAccount.syncingLabel,
  syncing: Copy.linkAccount.syncingLabel,
};

function formatTxDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LinkAccountScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { connect, phase, error } = usePlaidLink(user?.id ?? null);
  const { status, refresh, unlink } = useBankConnectionStatus(user?.id ?? null);
  const { transactions, loading: transactionsLoading, refresh: refreshTransactions } = useTransactions(user?.id ?? null);
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const isBusy = ["fetchingToken", "linking", "exchanging", "syncing"].includes(phase);

  React.useEffect(() => {
    if (phase === "done") {
      refresh();
      refreshTransactions();
      refreshCheckpointWidget();
    }
  }, [phase, refresh, refreshTransactions]);

  const handleUnlink = async () => {
    setUnlinkError(null);
    setUnlinking(true);
    try {
      await unlink();
      refreshCheckpointWidget();
    } catch {
      setUnlinkError(Copy.linkAccount.unlinkErrorFallback);
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Screen>
      <BackHeader title={Copy.linkAccount.title} subtitle={Copy.linkAccount.subtitle} />

      <Card>
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-headline ${dark ? "text-ink-dark" : "text-ink"}`}>
            Status
          </Text>
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                status === "linked" ? "bg-checkpoint" : "bg-ink-faint"
              }`}
            />
            <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
              {status === "linked" ? Copy.linkAccount.connectedLabel : Copy.linkAccount.unlinkedLabel}
            </Text>
          </View>
        </View>

        {error && (
          <Text className="text-sm text-signal-caution mb-3">
            {error || Copy.linkAccount.errorFallback}
          </Text>
        )}

        <Button
          label={isBusy ? phaseLabel[phase] ?? Copy.linkAccount.syncingLabel : Copy.linkAccount.connectCta}
          onPress={connect}
          loading={isBusy}
          disabled={isBusy}
        />

        {status === "linked" && (
          <View className="mt-3">
            <Button
              label={unlinking ? Copy.linkAccount.unlinkingLabel : Copy.linkAccount.unlinkCta}
              intent="ghost"
              onPress={handleUnlink}
              loading={unlinking}
              disabled={unlinking}
            />
            {unlinkError && (
              <Text className="mt-1 text-sm text-signal-caution">{unlinkError}</Text>
            )}
          </View>
        )}
      </Card>

      {status === "linked" && (
        <View className="mt-6">
          <Text className={`text-caption uppercase tracking-wide mb-2 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            Recent activity
          </Text>

          {transactionsLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#12B76A" />
            </View>
          ) : transactions.length === 0 ? (
            <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
              Nothing synced yet — check back after your next sync.
            </Text>
          ) : (
            <Card>
              {transactions.map((tx, i) => {
                const isCredit = tx.amountCents < 0;
                return (
                  <View
                    key={tx.id}
                    className={`flex-row items-center py-3 ${
                      i < transactions.length - 1 ? `border-b ${dark ? "border-hairline-dark" : "border-hairline"}` : ""
                    }`}
                  >
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: dark ? "#232A27" : "#EFF6F1" }}
                    >
                      <Text className="text-xs font-bold" style={{ color: dark ? "#8FA99B" : "#4A6B58" }}>
                        {tx.merchantName.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1 pr-3">
                      <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
                        {tx.merchantName}
                      </Text>
                      <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                        {[humanizeCategory(tx.category), formatTxDate(tx.transactedAt)].filter(Boolean).join(" · ")}
                        {tx.pending ? " · Pending" : ""}
                      </Text>
                    </View>
                    <Text
                      className="text-base font-semibold"
                      style={{ color: isCredit ? "#12B76A" : dark ? "#EDF7F2" : "#12211B" }}
                    >
                      {isCredit ? "+" : "-"}
                      {money(Math.abs(tx.amountCents))}
                    </Text>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      )}
    </Screen>
  );
}
