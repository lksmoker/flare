import { Pressable, StyleSheet, Text } from "react-native";

import flareContent from "../content/flareContent.json";
import { flareTheme } from "../theme/flareTheme";

type SendFlareButtonProps = {
  disabled?: boolean;
  isPending?: boolean;
  onPress: () => void;
};

export function SendFlareButton({
  disabled = false,
  isPending = false,
  onPress,
}: SendFlareButtonProps) {
  return (
    <Pressable
      accessibilityHint={flareContent.components.sendFlare.hint}
      accessibilityRole="button"
      accessibilityState={{ busy: isPending, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={styles.label}>
        {isPending
          ? flareContent.components.sendFlare.sendingLabel
          : flareContent.components.sendFlare.label}
      </Text>
      <Text style={styles.supportingCopy}>
        {isPending
          ? flareContent.components.sendFlare.sendingCopy
          : flareContent.components.sendFlare.copy}
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
  buttonDisabled: {
    opacity: 0.6,
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
