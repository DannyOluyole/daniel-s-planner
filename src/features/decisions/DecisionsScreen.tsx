import React, { useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { sumMoneyProtected, mostCommonPauseReason } from "@domain/money/decisionJournal";
import { decisionsToCsv } from "@domain/money/decisionExport";
import { useDecisions } from "@shared/hooks/useDecisions";
import { useAuth } from "@core/auth/AuthContext";
import { DecisionRow } from "./components/DecisionRow";

export function DecisionsScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { decisions, loading } = useDecisions(user?.id ?? null, 200);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const moneyProtectedCents = sumMoneyProtected(decisions);
  const topReason = mostCommonPauseReason(decisions);

  const handleExport = async () => {
    if (Platform.OS === "web") {
      setExportError(Copy.decisionsScreen.exportUnsupported);
      return;
    }
    setExportError(null);
    setExporting(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setExportError(Copy.decisionsScreen.exportUnsupported);
        return;
      }
      const csv = decisionsToCsv(decisions);
      const uri = `${FileSystem.documentDirectory}checkpoint-decisions-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: Copy.decisionsScreen.exportCta });
    } catch {
      setExportError(Copy.decisionsScreen.exportError);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen>
      <BackHeader title={Copy.decisionsScreen.title} subtitle={Copy.decisionsScreen.subtitle} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#12B76A" />
        </View>
      ) : decisions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className={`text-center text-sm ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.decisionsScreen.empty}
          </Text>
        </View>
      ) : (
        <>
          <View className="mb-3">
            <Button
              label={exporting ? Copy.decisionsScreen.exportingLabel : Copy.decisionsScreen.exportCta}
              intent="ghost"
              loading={exporting}
              onPress={handleExport}
            />
            {exportError && (
              <Text className="mt-1 text-sm text-signal-caution">{exportError}</Text>
            )}
          </View>
          <FlatList
            data={decisions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DecisionRow decision={item} />}
            showsVerticalScrollIndicator={false}
            className="mt-2"
            ListHeaderComponent={
              moneyProtectedCents > 0 ? (
                <Card raised className="mb-4">
                  <Text className={`text-base font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
                    {Copy.decisionsScreen.moneyProtectedLabel(money(moneyProtectedCents))}
                  </Text>
                  {topReason && (
                    <Text className={`mt-1 text-xs ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                      {Copy.decisionsScreen.topReasonLabel(topReason)}
                    </Text>
                  )}
                </Card>
              ) : null
            }
          />
        </>
      )}
    </Screen>
  );
}
