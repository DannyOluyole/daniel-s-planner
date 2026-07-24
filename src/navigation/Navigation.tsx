import React from "react";
import {
  NavigationContainer,
  LinkingOptions,
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
  BottomTabBarButtonProps,
} from "@react-navigation/bottom-tabs";
import { View, Pressable } from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@core/theme/ThemeContext";
import { colors } from "@core/theme/tokens";
import { Copy } from "@core/copy/strings";
import { HomeScreen } from "@features/home/HomeScreen";
import { ManageMoneyScreen } from "@features/home/ManageMoneyScreen";
import { NewDecisionScreen } from "@features/spending-wall/NewDecisionScreen";
import { SpendingWallScreen } from "@features/spending-wall/SpendingWallScreen";
import { FutureYouScreen } from "@features/future-you/FutureYouScreen";
import { SettingsScreen } from "@features/settings/SettingsScreen";
import { DecisionsScreen } from "@features/decisions/DecisionsScreen";
import { LinkAccountScreen } from "@features/link-account/LinkAccountScreen";
import { WatchedPlacesScreen } from "@features/places/WatchedPlacesScreen";

// The four destinations someone actually returns to, always reachable in one
// tap. Everything else (the decision flow, drilling into managing income and
// bills, Settings' own sub-pages) is a deliberate step forward from one of
// these, not a peer of them.
export type TabParamList = {
  Home: undefined;
  FutureYou: undefined;
  // Never actually navigated into — its press is intercepted to open
  // Decision Mode instead, so a new Checkpoint is one tap away from any
  // tab, not just Home. See CenterActionButton.
  NewDecisionTab: undefined;
  Decisions: undefined;
  Settings: undefined;
};

// Settings carries its own stack rather than being a single flat screen —
// Link Account and Places to Watch are configuration someone visits rarely,
// not places worth their own tab.
export type SettingsStackParamList = {
  SettingsHome: undefined;
  LinkAccount: undefined;
  WatchedPlaces: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  // A deliberate step forward from Home, not a peer of it — entering a
  // purchase and sitting with Decision Mode are a single continuous flow,
  // presented over the tab bar rather than replacing it.
  NewDecision: undefined;
  SpendingWall: {
    amountCents: number;
    merchant: string;
    category?: string;
  };
  // Editing income/bills/goals is upkeep, not something glanced at daily —
  // pulled off Home's main scroll so Home can stay a quick daily read.
  ManageMoney: undefined;
};

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, T>,
  BottomTabScreenProps<TabParamList, "Settings">
>;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
      <SettingsStack.Screen name="LinkAccount" component={LinkAccountScreen} />
      <SettingsStack.Screen name="WatchedPlaces" component={WatchedPlacesScreen} />
    </SettingsStack.Navigator>
  );
}

type RealTabName = "Home" | "FutureYou" | "Decisions" | "Settings";

const TAB_ICONS: Record<RealTabName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: "home", inactive: "home-outline" },
  FutureYou: { active: "trending-up", inactive: "trending-up-outline" },
  Decisions: { active: "time", inactive: "time-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
};

// Tab.Screen requires a component even though this one's press is always
// intercepted before it could render.
function NoopScreen() {
  return null;
}

/**
 * Floats above the tab bar rather than sitting in line with the other
 * icons — the raised-circle treatment common to "primary action in a tab
 * bar" patterns, so the one thing worth doing from anywhere (start a
 * Checkpoint) reads as distinct from the four destinations around it.
 */
function CenterActionButton({ onPress }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${Copy.checkpoint}`}
      style={{ top: -18, flex: 1, alignItems: "center" }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.checkpoint,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#12B76A",
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={30} color="#04180E" />
      </View>
    </Pressable>
  );
}

function Tabs() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  return (
    <Tab.Navigator
      screenListeners={{
        // One shared tap moment for every tab — the center action button
        // gets its own redirect logic below, but the haptic here already
        // covers it too.
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: dark ? colors.checkpointBright : colors.checkpoint,
        tabBarInactiveTintColor: dark ? colors.inkFaint : colors.inkSoft,
        tabBarStyle: {
          backgroundColor: dark ? colors.surfaceDark : colors.surface,
          borderTopColor: dark ? colors.hairlineDark : colors.hairline,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as RealTabName];
          return (
            <View
              style={{
                width: 40,
                height: 26,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? (dark ? colors.surfaceRaisedDark : colors.checkpointSoft) : "transparent",
              }}
            >
              <Ionicons name={focused ? icons.active : icons.inactive} size={size ?? 20} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="FutureYou" component={FutureYouScreen} options={{ title: "Future You" }} />
      <Tab.Screen
        name="NewDecisionTab"
        component={NoopScreen}
        options={{ tabBarButton: (props) => <CenterActionButton {...props} />, tabBarLabel: () => null }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("NewDecision");
          },
        })}
      />
      <Tab.Screen name="Decisions" component={DecisionsScreen} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}

// One-tap entry points (lock-screen widget, Action Button shortcut, browser
// extension) all land on checkpoint://decision — straight into Decision
// Mode, no navigating through Home first. On web the same map makes
// /decision work as a plain URL.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "checkpoint://"],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: "",
          FutureYou: "future-you",
          Decisions: "decisions",
          Settings: {
            screens: {
              SettingsHome: "settings",
            },
          },
        },
      },
      NewDecision: "decision",
    },
  },
};

export function Navigation() {
  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={Tabs} />
        <RootStack.Screen
          name="NewDecision"
          component={NewDecisionScreen}
          options={{ presentation: "modal" }}
        />
        <RootStack.Screen
          name="SpendingWall"
          component={SpendingWallScreen}
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
        <RootStack.Screen name="ManageMoney" component={ManageMoneyScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
