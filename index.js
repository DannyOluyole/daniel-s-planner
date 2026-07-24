// Entry point. `@expo/metro-runtime` must load first on web — it wires up
// the dev-mode module system so `registerRootComponent` actually mounts.
import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { Platform } from "react-native";
import App from "./App";

if (Platform.OS === "android") {
  const { setupCheckpointWidget } = require("./src/features/widget/widgetTaskHandler");
  setupCheckpointWidget();
}

registerRootComponent(App);
