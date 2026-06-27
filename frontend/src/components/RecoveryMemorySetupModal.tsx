import { StyleSheet, Text, View } from "react-native";

import { PlaceholderModal } from "./PlaceholderModal";

type RecoveryMemorySetupModalProps = {
  onClose: () => void;
  visible: boolean;
};

const memoryPrompts = [
  "Why do you want to interrupt this pattern?",
  "What does continuing cost you?",
  "What should grounded-you say in the first two minutes?",
];

export function RecoveryMemorySetupModal({
  onClose,
  visible,
}: RecoveryMemorySetupModalProps) {
  return (
    <PlaceholderModal
      onClose={onClose}
      subtitle="A V0 ownership placeholder for Recovery Memory editing."
      title="Recovery Memory Setup"
      visible={visible}
    >
      {memoryPrompts.map((prompt) => (
        <View key={prompt} style={styles.card}>
          <Text style={styles.cardTitle}>{prompt}</Text>
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
