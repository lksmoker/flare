import { Pressable, StyleSheet, Text } from "react-native";

import flareContent from "../content/flareContent.json";
import { flareTheme } from "../theme/flareTheme";

type SendFlareButtonProps = {
  onPress: () => void;
};

export function SendFlareButton({ onPress }: SendFlareButtonProps) {
  return (
    <Pressable
      accessibilityHint={flareContent.components.sendFlare.hint}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.label}>{flareContent.components.sendFlare.label}</Text>
      <Text style={styles.supportingCopy}>
        {flareContent.components.sendFlare.copy}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    ...flareTheme.shadows.hero,
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 28,
    backgroundColor: flareTheme.colors.primary,
  },
  label: {
    color: flareTheme.colors.onPrimary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  supportingCopy: {
    color: flareTheme.colors.onPrimaryMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
