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
  createEmptyBehaviorPattern,
  useBehaviorPattern,
} from "../state/BehaviorPatternContext";

type BehaviorPatternSetupModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function BehaviorPatternSetupModal({
  onClose,
  visible,
}: BehaviorPatternSetupModalProps) {
  const { behaviorPattern, saveBehaviorPattern } = useBehaviorPattern();
  const [draft, setDraft] = useState(createEmptyBehaviorPattern);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(behaviorPattern ?? createEmptyBehaviorPattern());
  }, [behaviorPattern, visible]);

  const saveDisabled =
    draft.behaviorName.trim().length === 0 ||
    draft.preferredRecoveryActions.trim().length === 0;

  return (
    <PlaceholderModal
      onClose={onClose}
      subtitle="Keep it concrete enough to interrupt the pattern, but light enough to edit anytime."
      title="Behavior Pattern Setup"
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Capture the pattern you want Flare to help interrupt. This stays
          local and editable in V0.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Behavior name</Text>
          <TextInput
            accessibilityLabel="Behavior name"
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, behaviorName: value }))
            }
            placeholder="Doomscrolling after work"
            style={styles.input}
            value={draft.behaviorName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Short description</Text>
          <TextInput
            accessibilityLabel="Short description"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, shortDescription: value }))
            }
            placeholder="What the spiral feels like when it starts."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.shortDescription}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Common triggers</Text>
          <TextInput
            accessibilityLabel="Common triggers"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, commonTriggers: value }))
            }
            placeholder="Stress, boredom, being alone, an argument."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.commonTriggers}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Risk times or situations</Text>
          <TextInput
            accessibilityLabel="Risk times or situations"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({
                ...current,
                riskTimesOrSituations: value,
              }))
            }
            placeholder="Late nights, payday, after a setback."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.riskTimesOrSituations}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Preferred recovery actions</Text>
          <TextInput
            accessibilityLabel="Preferred recovery actions"
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({
                ...current,
                preferredRecoveryActions: value,
              }))
            }
            placeholder="Put the phone down, stand up, text a friend, drink water."
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.preferredRecoveryActions}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.helperCopy}>
            Save requires a behavior name and at least one recovery action.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={saveDisabled}
            onPress={() => {
              saveBehaviorPattern(draft);
              onClose();
            }}
            style={[
              styles.saveButton,
              saveDisabled ? styles.saveButtonDisabled : null,
            ]}
          >
            <Text style={styles.saveButtonLabel}>Save Behavior Pattern</Text>
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
