import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PlaceholderModal } from "./PlaceholderModal";
import {
  createEmptyRecoveryMemory,
  useRecoveryMemory,
} from "../state/RecoveryMemoryContext";

type RecoveryMemorySetupModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function RecoveryMemorySetupModal({
  onClose,
  visible,
}: RecoveryMemorySetupModalProps) {
  const { recoveryMemory, saveRecoveryMemory } = useRecoveryMemory();
  const [draft, setDraft] = useState(createEmptyRecoveryMemory);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(recoveryMemory ?? createEmptyRecoveryMemory());
  }, [recoveryMemory, visible]);

  const saveDisabled =
    draft.interruptionReasons.trim().length === 0 ||
    draft.supportivePhrase.trim().length === 0;

  return (
    <PlaceholderModal
      onClose={onClose}
      subtitle="Capture grounded words you will want available when the hard moment lands."
      title="Recovery Memory Setup"
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Keep it honest, specific, and easy to revisit. This stays local and
          editable in V0.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Why interrupt this pattern?</Text>
          <TextInput
            accessibilityLabel="Why interrupt this pattern?"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, interruptionReasons: value }))
            }
            placeholder="I want to stop before I lose the rest of tonight."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.interruptionReasons}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Costs or consequences of continuing</Text>
          <TextInput
            accessibilityLabel="Costs or consequences of continuing"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, continuingCosts: value }))
            }
            placeholder="I will feel foggy tomorrow and break trust with myself again."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.continuingCosts}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Reminder from grounded self</Text>
          <TextInput
            accessibilityLabel="Reminder from grounded self"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, groundedReminders: value }))
            }
            placeholder="This urge peaks fast. You do not need to obey it."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.groundedReminders}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Emergency action or commitment</Text>
          <TextInput
            accessibilityLabel="Emergency action or commitment"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, emergencyActions: value }))
            }
            placeholder="Put the phone in the kitchen, drink water, and walk outside."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.emergencyActions}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Supportive phrase to show during recovery</Text>
          <TextInput
            accessibilityLabel="Supportive phrase to show during recovery"
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, supportivePhrase: value }))
            }
            placeholder="Pause now. Protect tomorrow."
            style={styles.input}
            value={draft.supportivePhrase}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.helperCopy}>
            Save requires one interruption reason and one supportive phrase.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={saveDisabled}
            onPress={() => {
              saveRecoveryMemory(draft);
              onClose();
            }}
            style={[
              styles.saveButton,
              saveDisabled ? styles.saveButtonDisabled : null,
            ]}
          >
            <Text style={styles.saveButtonLabel}>Save Recovery Memory</Text>
          </Pressable>
        </View>
      </ScrollView>
    </PlaceholderModal>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
    paddingBottom: 8,
  },
  intro: {
    color: "#526071",
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#5b4635",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dccfb8",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#1f2937",
  },
  multilineInput: {
    minHeight: 88,
  },
  footer: {
    gap: 10,
    paddingTop: 6,
  },
  helperCopy: {
    color: "#6a7685",
    fontSize: 13,
    lineHeight: 18,
  },
  saveButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#d6693d",
    paddingHorizontal: 18,
  },
  saveButtonDisabled: {
    backgroundColor: "#d8cbb8",
  },
  saveButtonLabel: {
    color: "#fffaf3",
    fontSize: 15,
    fontWeight: "800",
  },
});
