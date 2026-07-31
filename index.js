// Entry point. `@expo/metro-runtime` must load first on web — it wires up
// the dev-mode module system so `registerRootComponent` actually mounts.
import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { Platform } from "react-native";
import App from "./App";
// Registers the geofencing background task at module scope. Must be
// imported unconditionally, here, so it's defined even when the OS
// relaunches the JS engine specifically to run the task with the app not
// otherwise open — importing it lazily from inside a screen/component would
// miss exactly that case.
import "./src/features/places/geofencingTask";

if (Platform.OS === "android") {
  const { setupCheckpointWidget } = require("./src/features/widget/widgetTaskHandler");
  setupCheckpointWidget();
}

registerRootComponent(App);
