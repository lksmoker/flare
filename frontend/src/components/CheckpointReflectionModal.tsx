import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { PlaceholderModal } from "./PlaceholderModal";
import {
  createEmptyCheckpointReflection,
  FlareEvent,
  useFlareEvents,
} from "../state/FlareEventContext";

type CheckpointReflectionModalProps = {
  flareEvent: FlareEvent | null;
  onClose: () => void;
  visible: boolean;
};

export function CheckpointReflectionModal({
  flareEvent,
  onClose,
  visible,
}: CheckpointReflectionModalProps) {
  const { saveCheckpointReflection } = useFlareEvents();
  const [draft, setDraft] = useState(createEmptyCheckpointReflection);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(createEmptyCheckpointReflection());
  }, [visible]);

  const saveDisabled =
    !flareEvent ||
    draft.whatHappened.trim().length === 0 ||
    draft.whatHelped.trim().length === 0 ||
    draft.howIFeelNow.trim().length === 0 ||
    draft.outcome.trim().length === 0;

  return (
    <PlaceholderModal
      footer={
        <View style={styles.footer}>
          <Text style={styles.supportingCopy}>
            {flareContent.components.checkpointReflection.helperCopy}
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
                saveCheckpointReflection(draft);
                onClose();
              }}
              style={[
                styles.saveButton,
                saveDisabled ? styles.saveButtonDisabled : null,
              ]}
            >
              <Text style={styles.saveButtonLabel}>
                {flareContent.components.checkpointReflection.saveButton}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      onClose={onClose}
      subtitle={flareContent.components.checkpointReflection.modalSubtitle}
      title={flareContent.components.checkpointReflection.modalTitle}
      visible={visible}
    >
      <View style={styles.form}>
        {flareEvent ? (
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>
              {flareContent.components.checkpointReflection.context.activeLabel}
            </Text>
            <Text style={styles.contextCopy}>
              {flareContent.components.checkpointReflection.context.activeCopy}
            </Text>
          </View>
        ) : (
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>
              {flareContent.components.checkpointReflection.context.missingLabel}
            </Text>
            <Text style={styles.contextCopy}>
              {flareContent.components.checkpointReflection.context.missingCopy}
            </Text>
          </View>
        )}
        <Text style={styles.intro}>
          {flareContent.components.checkpointReflection.intro}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.checkpointReflection.fields.whatHappened.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.checkpointReflection.fields.whatHappened
                .label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, whatHappened: value }))
            }
            placeholder={
              flareContent.components.checkpointReflection.fields.whatHappened
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.whatHappened}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.checkpointReflection.fields.whatHelped.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.checkpointReflection.fields.whatHelped
                .label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, whatHelped: value }))
            }
            placeholder={
              flareContent.components.checkpointReflection.fields.whatHelped
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.whatHelped}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.checkpointReflection.fields.howIFeelNow.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.checkpointReflection.fields.howIFeelNow
                .label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, howIFeelNow: value }))
            }
            placeholder={
              flareContent.components.checkpointReflection.fields.howIFeelNow
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.howIFeelNow}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.checkpointReflection.fields.outcome.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.checkpointReflection.fields.outcome.label
            }
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, outcome: value }))
            }
            placeholder={
              flareContent.components.checkpointReflection.fields.outcome
                .placeholder
            }
            style={styles.input}
            value={draft.outcome}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.checkpointReflection.fields.note.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.checkpointReflection.fields.note.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, note: value }))
            }
            placeholder={
              flareContent.components.checkpointReflection.fields.note
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.note}
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
  contextCard: {
    gap: 6,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#f7efe3",
  },
  intro: {
    color: "#526071",
    fontSize: 14,
    lineHeight: 20,
  },
  contextLabel: {
    color: "#5b4635",
    fontSize: 15,
    fontWeight: "600",
  },
  contextCopy: {
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
  supportingCopy: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
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
