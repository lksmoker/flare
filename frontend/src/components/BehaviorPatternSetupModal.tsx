import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { flareTheme } from "../theme/flareTheme";
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
    draft.behaviorName.trim().length === 0;

  return (
    <PlaceholderModal
      footer={
        <View style={styles.footer}>
          <Text style={styles.helperCopy}>
            {flareContent.components.behaviorPattern.helperCopy}
          </Text>
          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonLabel}>
                {flareContent.common.actions.cancel}
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
                {flareContent.components.behaviorPattern.saveButton}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      onClose={onClose}
      subtitle={flareContent.components.behaviorPattern.modalSubtitle}
      title={flareContent.components.behaviorPattern.modalTitle}
      visible={visible}
    >
      <View style={styles.form}>
        <Text style={styles.intro}>
          {flareContent.components.behaviorPattern.intro}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.behaviorPattern.fields.behaviorName.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.behaviorPattern.fields.behaviorName.label
            }
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, behaviorName: value }))
            }
            placeholder={
              flareContent.components.behaviorPattern.fields.behaviorName
                .placeholder
            }
            style={styles.input}
            value={draft.behaviorName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {
              flareContent.components.behaviorPattern.fields.shortDescription
                .label
            }
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.behaviorPattern.fields.shortDescription
                .label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, shortDescription: value }))
            }
            placeholder={
              flareContent.components.behaviorPattern.fields.shortDescription
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.shortDescription}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.behaviorPattern.fields.commonTriggers.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.behaviorPattern.fields.commonTriggers.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, commonTriggers: value }))
            }
            placeholder={
              flareContent.components.behaviorPattern.fields.commonTriggers
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.commonTriggers}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {
              flareContent.components.behaviorPattern.fields
                .riskTimesOrSituations.label
            }
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.behaviorPattern.fields
                .riskTimesOrSituations.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({
                ...current,
                riskTimesOrSituations: value,
              }))
            }
            placeholder={
              flareContent.components.behaviorPattern.fields
                .riskTimesOrSituations.placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.riskTimesOrSituations}
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
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    color: flareTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: flareTheme.colors.textStrong,
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
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
    paddingHorizontal: 18,
  },
  cancelButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  helperCopy: {
    color: flareTheme.colors.textMuted,
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
    backgroundColor: flareTheme.colors.primary,
    paddingHorizontal: 18,
  },
  saveButtonDisabled: {
    backgroundColor: flareTheme.colors.primaryMutedStrong,
  },
  saveButtonLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
});
