import { Pressable, StyleSheet, Text } from "react-native";

type SendFlareButtonProps = {
  onPress: () => void;
};

export function SendFlareButton({ onPress }: SendFlareButtonProps) {
  return (
    <Pressable
      accessibilityHint="Starts the placeholder recovery response immediately."
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.label}>Send Flare</Text>
      <Text style={styles.supportingCopy}>
        Enter the placeholder Recovery Response with no confirmation step.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 28,
    backgroundColor: "#d6693d",
    shadowColor: "#8a3f22",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  label: {
    color: "#fffaf3",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  supportingCopy: {
    color: "#fff4e8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
