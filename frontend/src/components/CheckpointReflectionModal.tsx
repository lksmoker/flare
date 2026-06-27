import { StyleSheet, Text, View } from "react-native";

import { PlaceholderModal } from "./PlaceholderModal";

type CheckpointReflectionModalProps = {
  onClose: () => void;
  visible: boolean;
};

const reflectionPrompts = [
  "What happened right before the urge shifted?",
  "What helped, even a little?",
  "How do you feel now?",
];

export function CheckpointReflectionModal({
  onClose,
  visible,
}: CheckpointReflectionModalProps) {
  return (
    <PlaceholderModal
      onClose={onClose}
      subtitle="A quick placeholder sheet for the post-flare reflection flow."
      title="Checkpoint / Reflection"
      visible={visible}
    >
      {reflectionPrompts.map((prompt) => (
        <View key={prompt} style={styles.promptCard}>
          <Text style={styles.promptText}>{prompt}</Text>
        </View>
      ))}
      <Text style={styles.supportingCopy}>
        V0 keeps this lightweight. No persistence or journaling workflow is
        implemented in this slice.
      </Text>
    </PlaceholderModal>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#ffffff",
  },
  promptText: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  supportingCopy: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
  },
});
