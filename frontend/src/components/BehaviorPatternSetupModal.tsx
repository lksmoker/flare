import { StyleSheet, Text, View } from "react-native";

import { PlaceholderModal } from "./PlaceholderModal";

type BehaviorPatternSetupModalProps = {
  onClose: () => void;
  visible: boolean;
};

const starterFields = [
  "Behavior you want to interrupt",
  "Common triggers or risky moments",
  "Default recovery action you want in the moment",
];

export function BehaviorPatternSetupModal({
  onClose,
  visible,
}: BehaviorPatternSetupModalProps) {
  return (
    <PlaceholderModal
      onClose={onClose}
      subtitle="A V0 ownership placeholder for the behavior setup flow."
      title="Behavior Pattern Setup"
      visible={visible}
    >
      {starterFields.map((field) => (
        <View key={field} style={styles.card}>
          <Text style={styles.cardTitle}>{field}</Text>
        </View>
      ))}
    </PlaceholderModal>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#ffffff",
  },
  cardTitle: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
});
