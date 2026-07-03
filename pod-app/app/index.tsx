import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../src/theme";

// AuthGate (app/_layout.tsx) redirects away from here as soon as auth/pod
// state resolves. This just avoids a blank flash in the meantime.
export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.coral} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cloud,
  },
});
