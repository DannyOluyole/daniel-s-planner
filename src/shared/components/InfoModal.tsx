import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * The one modal primitive in the app — used for short explanatory content
 * (tooltips) and celebratory beats (milestones), never for forms or flows.
 * Built on React Native's own Modal rather than a library, since every use
 * so far is "read this, then dismiss," not a multi-step interaction.
 */
export function InfoModal({ visible, onClose, title, children }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const bg = dark ? "bg-surface-dark" : "bg-surface";
  const border = dark ? "border-hairline-dark" : "border-hairline";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className={`w-full max-w-sm rounded-xl2 border ${border} ${bg} p-5`}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className={`text-lg font-bold ${dark ? "text-ink-dark" : "text-ink"}`}>{title}</Text>
          <View className="mt-2">{children}</View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="mt-4 self-end px-3 py-1.5"
          >
            <Text className="text-sm font-semibold" style={{ color: "#12B76A" }}>
              Got it
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
