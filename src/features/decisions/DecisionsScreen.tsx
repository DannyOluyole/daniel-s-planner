import React from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { sumMoneyProtected, mostCommonPauseReason } from "@domain/money/decisionJournal";
import { useDecisions } from "@shared/hooks/useDecisions";
import { useAuth } from "@core/auth/AuthContext";
import { DecisionRow } from "./components/DecisionRow";

export function DecisionsScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { decisions, loading } = useDecisions(user?.id ?? null, 200);

  const moneyProtectedCents = sumMoneyProtected(decisions);
  const topReason = mostCommonPauseReason(decisions);

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
      )}
    </Screen>
  );
}
