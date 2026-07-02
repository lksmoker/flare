import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { PlaceholderModal } from "./PlaceholderModal";
import {
  createEmptyAnchorNote,
  useAnchorNote,
} from "../state/AnchorNoteContext";

type AnchorNoteSetupModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function AnchorNoteSetupModal({
  onClose,
  visible,
}: AnchorNoteSetupModalProps) {
  const { anchorNote, saveAnchorNote } = useAnchorNote();
  const [draft, setDraft] = useState(createEmptyAnchorNote);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(anchorNote ?? createEmptyAnchorNote());
  }, [anchorNote, visible]);

  const saveDisabled =
    draft.interruptionReasons.trim().length === 0 ||
    draft.supportivePhrase.trim().length === 0;

  return (
    <PlaceholderModal
      footer={
        <View style={styles.footer}>
          <Text style={styles.helperCopy}>
            {flareContent.components.anchorNote.helperCopy}
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
                saveAnchorNote(draft);
                onClose();
              }}
              style={[
                styles.saveButton,
                saveDisabled ? styles.saveButtonDisabled : null,
              ]}
            >
              <Text style={styles.saveButtonLabel}>
                {flareContent.components.anchorNote.saveButton}
              </Text>
            </Pressable>
          </View>
        </View>
      }
      onClose={onClose}
      subtitle={flareContent.components.anchorNote.modalSubtitle}
      title={flareContent.components.anchorNote.modalTitle}
      visible={visible}
    >
      <View style={styles.form}>
        <Text style={styles.intro}>{flareContent.components.anchorNote.intro}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.anchorNote.fields.interruptionReasons.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.anchorNote.fields.interruptionReasons.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, interruptionReasons: value }))
            }
            placeholder={
              flareContent.components.anchorNote.fields.interruptionReasons
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.interruptionReasons}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.anchorNote.fields.continuingCosts.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.anchorNote.fields.continuingCosts.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, continuingCosts: value }))
            }
            placeholder={
              flareContent.components.anchorNote.fields.continuingCosts
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.continuingCosts}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.anchorNote.fields.groundedReminders.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.anchorNote.fields.groundedReminders.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, groundedReminders: value }))
            }
            placeholder={
              flareContent.components.anchorNote.fields.groundedReminders
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.groundedReminders}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.anchorNote.fields.emergencyActions.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.anchorNote.fields.emergencyActions.label
            }
            multiline
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, emergencyActions: value }))
            }
            placeholder={
              flareContent.components.anchorNote.fields.emergencyActions
                .placeholder
            }
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={draft.emergencyActions}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            {flareContent.components.anchorNote.fields.supportivePhrase.label}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.components.anchorNote.fields.supportivePhrase.label
            }
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, supportivePhrase: value }))
            }
            placeholder={
              flareContent.components.anchorNote.fields.supportivePhrase
                .placeholder
            }
            style={styles.input}
            value={draft.supportivePhrase}
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
