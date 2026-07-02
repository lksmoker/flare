import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import flareContent from "../content/flareContent.json";
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
      footer={
        <View style={styles.footer}>
          <Text style={styles.helperCopy}>
            {flareContent.setup.behaviorPattern.helperCopy}
          </Text>
          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonLabel}>
                {flareContent.actions.cancel}
              </Text>
            </Pressable>
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
              <Text style={styles.saveButtonLabel}>
                {flareContent.setup.behaviorPattern.saveButton}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      onClose={onClose}
      subtitle={flareContent.setup.behaviorPattern.modalSubtitle}
      title={flareContent.setup.behaviorPattern.modalTitle}
      visible={visible}
    >
      <View style={styles.form}>
        <Text style={styles.intro}>{flareContent.setup.behaviorPattern.intro}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.setup.behaviorPattern.fields.behaviorName.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.setup.behaviorPattern.fields.behaviorName.label
            }
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, behaviorName: value }))
            }
            placeholder={
              flareContent.setup.behaviorPattern.fields.behaviorName.placeholder
            }
            style={styles.input}
            value={draft.behaviorName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.setup.behaviorPattern.fields.shortDescription.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.setup.behaviorPattern.fields.shortDescription.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, shortDescription: value }))
            }
            placeholder={
              flareContent.setup.behaviorPattern.fields.shortDescription.placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.shortDescription}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.setup.behaviorPattern.fields.commonTriggers.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.setup.behaviorPattern.fields.commonTriggers.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, commonTriggers: value }))
            }
            placeholder={
              flareContent.setup.behaviorPattern.fields.commonTriggers.placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.commonTriggers}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {
              flareContent.setup.behaviorPattern.fields.riskTimesOrSituations
                .label
            }
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.setup.behaviorPattern.fields.riskTimesOrSituations.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({
                ...current,
                riskTimesOrSituations: value,
              }))
            }
            placeholder={
              flareContent.setup.behaviorPattern.fields.riskTimesOrSituations
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.riskTimesOrSituations}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {
              flareContent.setup.behaviorPattern.fields.preferredRecoveryActions
                .label
            }
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.setup.behaviorPattern.fields.preferredRecoveryActions
                .label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({
                ...current,
                preferredRecoveryActions: value,
              }))
            }
            placeholder={
              flareContent.setup.behaviorPattern.fields.preferredRecoveryActions
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.preferredRecoveryActions}
          />
        </View>
      </View>
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
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cancelButton: {
    flexGrow: 1,
    minHeight: 48,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dccfb8",
    backgroundColor: "#fff9f1",
    paddingHorizontal: 18,
  },
  cancelButtonLabel: {
    color: "#5b4635",
    fontSize: 15,
    fontWeight: "700",
  },
  helperCopy: {
    color: "#6a7685",
    fontSize: 13,
    lineHeight: 18,
  },
  saveButton: {
    flexGrow: 2,
    minHeight: 48,
    minWidth: 180,
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
