import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import flareContent from "../content/flareContent.json";
import { type SavedFlarePlanAction } from "../services/flarePlanApi";
import { useFlarePlan } from "../state/FlarePlanContext";
import { flareTheme } from "../theme/flareTheme";
import { PlaceholderModal } from "./PlaceholderModal";

type FlarePlanSetupModalProps = {
  onClose: () => void;
  visible: boolean;
};

type ActionDraft = {
  actionId: string | null;
  description: string;
  title: string;
};

function createEmptyDraft(): ActionDraft {
  return {
    actionId: null,
    description: "",
    title: "",
  };
}

function groupTemplatesByCategory(templates: ReturnType<typeof useFlarePlan>["templates"]) {
  const grouped = new Map<
    string,
    {
      categoryLabel: string;
      templates: typeof templates;
    }
  >();

  templates.forEach((template) => {
    const currentGroup = grouped.get(template.category);

    if (currentGroup) {
      currentGroup.templates.push(template);
      return;
    }

    grouped.set(template.category, {
      categoryLabel: template.category_label,
      templates: [template],
    });
  });

  return [...grouped.entries()].map(([category, value]) => ({
    category,
    categoryLabel: value.categoryLabel,
    templates: value.templates,
  }));
}

function validateDraft(draft: ActionDraft) {
  const trimmedTitle = draft.title.trim();
  const trimmedDescription = draft.description.trim();

  if (!trimmedTitle) {
    return "Add a short title before saving this action.";
  }
  if (trimmedTitle.length > 120) {
    return "Keep the title to 120 characters or fewer.";
  }
  if (trimmedDescription.length > 300) {
    return "Keep the description to 300 characters or fewer.";
  }

  return null;
}

function buildActionLabel(
  action: SavedFlarePlanAction,
  totalCount: number,
  maximumCount: number,
) {
  const countText = `${totalCount} of ${maximumCount} actions`;
  const statusText = totalCount > 0 ? "Configured" : "Not configured";

  return `${statusText} | ${countText} | ${action.position}`;
}

export function FlarePlanSetupModal({
  onClose,
  visible,
}: FlarePlanSetupModalProps) {
  const {
    archiveAction,
    createFromTemplate,
    ensureTemplatesLoaded,
    errorBanner,
    isActionPending,
    isAtActionLimit,
    isInitialLoading,
    isPlanConfigured,
    isReorderPending,
    isRefreshing,
    isTemplatePending,
    plan,
    planError,
    refetchAll,
    reorderActions,
    retryPlan,
    retryTemplates,
    saveAction,
    templates,
    templatesError,
  } = useFlarePlan();
  const [draft, setDraft] = useState<ActionDraft>(createEmptyDraft);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [archiveCandidate, setArchiveCandidate] =
    useState<SavedFlarePlanAction | null>(null);

  useEffect(() => {
    if (!visible) {
      setDraft(createEmptyDraft());
      setDraftError(null);
      setIsComposerVisible(false);
      setArchiveCandidate(null);
      return;
    }

    void ensureTemplatesLoaded();
  }, [ensureTemplatesLoaded, visible]);

  const groupedTemplates = useMemo(
    () => groupTemplatesByCategory(templates),
    [templates],
  );

  const planCountLabel = plan
    ? `${plan.active_action_count} of ${plan.maximum_active_actions} actions`
    : "0 of 10 actions";

  const statusLabel = isPlanConfigured
    ? flareContent.common.status.configured
    : flareContent.components.flarePlan.notConfigured;

  const startCreateAction = () => {
    setDraft(createEmptyDraft());
    setDraftError(null);
    setIsComposerVisible(true);
  };

  const startEditAction = (action: SavedFlarePlanAction) => {
    setDraft({
      actionId: action.id,
      description: action.description ?? "",
      title: action.title,
    });
    setDraftError(null);
    setIsComposerVisible(true);
  };

  const submitDraft = async () => {
    const validationError = validateDraft(draft);

    if (validationError) {
      setDraftError(validationError);
      return;
    }

    setDraftError(null);
    setIsSubmittingDraft(true);

    const saved = await saveAction({
      actionId: draft.actionId ?? undefined,
      description: draft.description.trim(),
      title: draft.title.trim(),
    });

    setIsSubmittingDraft(false);

    if (!saved) {
      return;
    }

    setDraft(createEmptyDraft());
    setIsComposerVisible(false);
  };

  const moveAction = async (actionId: string, direction: "up" | "down") => {
    if (!plan) {
      return;
    }

    const currentIndex = plan.actions.findIndex((action) => action.id === actionId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= plan.actions.length) {
      return;
    }

    const nextActionIds = [...plan.actions.map((action) => action.id)];
    const [movedActionId] = nextActionIds.splice(currentIndex, 1);
    nextActionIds.splice(targetIndex, 0, movedActionId);
    await reorderActions(nextActionIds);
  };

  return (
    <>
      <PlaceholderModal
        footer={
          <View style={styles.footer}>
            <Text style={styles.helperCopy}>
              {flareContent.components.flarePlan.helperCopy}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeFooterButton}
            >
              <Text style={styles.closeFooterButtonLabel}>
                {flareContent.common.modal.close}
              </Text>
            </Pressable>
          </View>
        }
        onClose={onClose}
        subtitle={flareContent.components.flarePlan.modalSubtitle}
        title={flareContent.components.flarePlan.modalTitle}
        visible={visible}
      >
        <View style={styles.stack}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              {flareContent.components.flarePlan.cardTitle}
            </Text>
            <Text style={styles.introCopy}>
              {flareContent.components.flarePlan.cardCopy}
            </Text>
            <View style={styles.readinessRow}>
              <Text
                style={[
                  styles.statusBadge,
                  isPlanConfigured ? styles.readyBadge : styles.pendingBadge,
                ]}
              >
                {statusLabel}
              </Text>
              <Text style={styles.readinessMeta}>{planCountLabel}</Text>
            </View>
            {isRefreshing ? (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.refreshingText}
              >
                {flareContent.components.flarePlan.loading.refreshing}
              </Text>
            ) : null}
          </View>

          {errorBanner ? (
            <View style={styles.errorCard}>
              <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                {errorBanner.message}
              </Text>
            </View>
          ) : null}

          {isComposerVisible ? (
            <View style={styles.composerCard}>
              <Text style={styles.sectionTitle}>
                {draft.actionId
                  ? flareContent.components.flarePlan.editActionTitle
                  : flareContent.components.flarePlan.addActionTitle}
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>
                  {flareContent.components.flarePlan.fields.title.label}
                </Text>
                <TextInput
                  accessibilityLabel={
                    flareContent.components.flarePlan.fields.title.label
                  }
                  maxLength={120}
                  onChangeText={(value) =>
                    setDraft((current) => ({ ...current, title: value }))
                  }
                  placeholder={
                    flareContent.components.flarePlan.fields.title.placeholder
                  }
                  style={styles.input}
                  value={draft.title}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  {flareContent.components.flarePlan.fields.description.label}
                </Text>
                <TextInput
                  accessibilityLabel={
                    flareContent.components.flarePlan.fields.description.label
                  }
                  maxLength={300}
                  multiline
                  onChangeText={(value) =>
                    setDraft((current) => ({ ...current, description: value }))
                  }
                  placeholder={
                    flareContent.components.flarePlan.fields.description
                      .placeholder
                  }
                  style={[styles.input, styles.multilineInput]}
                  textAlignVertical="top"
                  value={draft.description}
                />
              </View>

              {draftError ? (
                <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                  {draftError}
                </Text>
              ) : null}

              <View style={styles.composerActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDraft(createEmptyDraft());
                    setDraftError(null);
                    setIsComposerVisible(false);
                  }}
                  style={styles.secondaryActionButton}
                >
                  <Text style={styles.secondaryActionButtonLabel}>
                    {flareContent.common.actions.cancel}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmittingDraft}
                  onPress={() => {
                    void submitDraft();
                  }}
                  style={[
                    styles.primaryActionButton,
                    isSubmittingDraft ? styles.primaryActionButtonDisabled : null,
                  ]}
                >
                  <Text style={styles.primaryActionButtonLabel}>
                    {isSubmittingDraft
                      ? flareContent.components.flarePlan.actions.saving
                      : flareContent.components.flarePlan.actions.save}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={flareContent.components.flarePlan.actions.addCustom}
              accessibilityRole="button"
              accessibilityState={{ disabled: isAtActionLimit }}
              disabled={isAtActionLimit}
              onPress={startCreateAction}
              style={[
                styles.addButton,
                isAtActionLimit ? styles.addButtonDisabled : null,
              ]}
            >
              <Text style={styles.addButtonLabel}>
                {flareContent.components.flarePlan.actions.addCustom}
              </Text>
            </Pressable>
          )}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {flareContent.components.flarePlan.activeActionsTitle}
              </Text>
              <Text style={styles.sectionMeta}>{planCountLabel}</Text>
            </View>

            {isInitialLoading && !plan ? (
              <Text accessibilityLiveRegion="polite" style={styles.loadingText}>
                {flareContent.components.flarePlan.loading.initial}
              </Text>
            ) : null}

            {planError ? (
              <View style={styles.errorBlock}>
                <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                  {planError}
                </Text>
                <View style={styles.inlineActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void retryPlan();
                    }}
                    style={styles.inlineButton}
                  >
                    <Text style={styles.inlineButtonLabel}>
                      {flareContent.components.flarePlan.actions.retryPlan}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void refetchAll();
                    }}
                    style={styles.inlineButton}
                  >
                    <Text style={styles.inlineButtonLabel}>
                      {flareContent.components.flarePlan.actions.retryAll}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {!planError && plan && plan.actions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  {flareContent.components.flarePlan.emptyTitle}
                </Text>
                <Text style={styles.emptyStateCopy}>
                  {flareContent.components.flarePlan.emptyCopy}
                </Text>
              </View>
            ) : null}

            {!planError && plan
              ? plan.actions.map((action, index) => (
                  <View key={action.id} style={styles.actionCard}>
                    <View style={styles.actionHeader}>
                      <View style={styles.actionHeaderCopy}>
                        <Text style={styles.actionPosition}>
                          {`Step ${action.position}`}
                        </Text>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                      </View>
                      <Text style={styles.actionOrderMeta}>
                        {buildActionLabel(
                          action,
                          plan.active_action_count,
                          plan.maximum_active_actions,
                        )}
                      </Text>
                    </View>

                    {action.description ? (
                      <Text style={styles.actionDescription}>
                        {action.description}
                      </Text>
                    ) : null}

                    <View style={styles.inlineActions}>
                      <Pressable
                        accessibilityLabel={`Edit action ${action.title}`}
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled: isActionPending(action.id),
                        }}
                        disabled={isActionPending(action.id)}
                        onPress={() => startEditAction(action)}
                        style={styles.inlineButton}
                      >
                        <Text style={styles.inlineButtonLabel}>
                          {flareContent.components.flarePlan.actions.edit}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Move action ${action.title} up`}
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled:
                            index === 0 ||
                            isReorderPending ||
                            isActionPending(action.id),
                        }}
                        disabled={
                          index === 0 ||
                          isReorderPending ||
                          isActionPending(action.id)
                        }
                        onPress={() => {
                          void moveAction(action.id, "up");
                        }}
                        style={styles.inlineButton}
                      >
                        <Text style={styles.inlineButtonLabel}>
                          {flareContent.components.flarePlan.actions.moveUp}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Move action ${action.title} down`}
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled:
                            index === plan.actions.length - 1 ||
                            isReorderPending ||
                            isActionPending(action.id),
                        }}
                        disabled={
                          index === plan.actions.length - 1 ||
                          isReorderPending ||
                          isActionPending(action.id)
                        }
                        onPress={() => {
                          void moveAction(action.id, "down");
                        }}
                        style={styles.inlineButton}
                      >
                        <Text style={styles.inlineButtonLabel}>
                          {flareContent.components.flarePlan.actions.moveDown}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Remove action ${action.title}`}
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled: isActionPending(action.id),
                        }}
                        disabled={isActionPending(action.id)}
                        onPress={() => setArchiveCandidate(action)}
                        style={styles.inlineButton}
                      >
                        <Text style={styles.removeButtonLabel}>
                          {flareContent.components.flarePlan.actions.remove}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              : null}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {flareContent.components.flarePlan.starterLibraryTitle}
              </Text>
              {isAtActionLimit ? (
                <Text style={styles.limitText}>
                  {flareContent.components.flarePlan.limitReachedCopy}
                </Text>
              ) : null}
            </View>

            {templatesError ? (
              <View style={styles.errorBlock}>
                <Text accessibilityLiveRegion="polite" style={styles.errorText}>
                  {templatesError}
                </Text>
                <View style={styles.inlineActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void retryTemplates();
                    }}
                    style={styles.inlineButton}
                  >
                    <Text style={styles.inlineButtonLabel}>
                      {flareContent.components.flarePlan.actions.retryTemplates}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void refetchAll();
                    }}
                    style={styles.inlineButton}
                  >
                    <Text style={styles.inlineButtonLabel}>
                      {flareContent.components.flarePlan.actions.retryAll}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {!templatesError && groupedTemplates.length === 0 ? (
              <Text style={styles.emptyStateCopy}>
                {flareContent.components.flarePlan.noTemplatesCopy}
              </Text>
            ) : null}

            {!templatesError
              ? groupedTemplates.map((group) => (
                  <View key={group.category} style={styles.templateGroup}>
                    <Text style={styles.templateGroupTitle}>
                      {group.categoryLabel}
                    </Text>
                    <View style={styles.templateList}>
                      {group.templates.map((template) => {
                        const isPending = isTemplatePending(
                          template.template_key,
                        );
                        const isDisabled =
                          template.is_selected || isPending || isAtActionLimit;

                        return (
                          <Pressable
                            key={template.template_key}
                            accessibilityLabel={`Add starter action ${template.title}`}
                            accessibilityRole="button"
                            accessibilityState={{
                              disabled: isDisabled,
                              selected: template.is_selected,
                            }}
                            disabled={isDisabled}
                            onPress={() => {
                              void createFromTemplate(template.template_key);
                            }}
                            style={[
                              styles.templateCard,
                              template.is_selected
                                ? styles.templateCardSelected
                                : null,
                            ]}
                          >
                            <View style={styles.templateHeader}>
                              <Text style={styles.templateTitle}>
                                {template.title}
                              </Text>
                              <Text
                                style={[
                                  styles.templateState,
                                  template.is_selected
                                    ? styles.templateStateSelected
                                    : null,
                                ]}
                              >
                                {isPending
                                  ? flareContent.components.flarePlan.actions
                                      .adding
                                  : template.is_selected
                                    ? flareContent.components.flarePlan.selected
                                    : flareContent.components.flarePlan.actions
                                        .addStarter}
                              </Text>
                            </View>
                            {template.description ? (
                              <Text style={styles.templateDescription}>
                                {template.description}
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))
              : null}
          </View>
        </View>
      </PlaceholderModal>

      <PlaceholderModal
        footer={
          <View style={styles.footer}>
            <View style={styles.composerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setArchiveCandidate(null)}
                style={styles.secondaryActionButton}
              >
                <Text style={styles.secondaryActionButtonLabel}>
                  {flareContent.common.actions.cancel}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={
                  !archiveCandidate ||
                  (archiveCandidate
                    ? isActionPending(archiveCandidate.id)
                    : false)
                }
                onPress={() => {
                  if (!archiveCandidate) {
                    return;
                  }

                  void archiveAction(archiveCandidate.id).then((removed) => {
                    if (removed) {
                      setArchiveCandidate(null);
                    }
                  });
                }}
                style={styles.primaryActionButton}
              >
                <Text style={styles.primaryActionButtonLabel}>
                  {flareContent.components.flarePlan.actions.remove}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        onClose={() => setArchiveCandidate(null)}
        subtitle={flareContent.components.flarePlan.removeBody}
        title={flareContent.components.flarePlan.removeTitle}
        visible={Boolean(archiveCandidate)}
      >
        <Text style={styles.introCopy}>
          {flareContent.components.flarePlan.removeBody}
        </Text>
      </PlaceholderModal>
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  introCard: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  introTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  introCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  readinessRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  readinessMeta: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  refreshingText: {
    color: flareTheme.colors.textSubtle,
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  readyBadge: {
    backgroundColor: flareTheme.colors.successBg,
    color: flareTheme.colors.successText,
  },
  pendingBadge: {
    backgroundColor: flareTheme.colors.neutralBg,
    color: flareTheme.colors.neutralText,
  },
  errorCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FDECEA",
  },
  errorText: {
    color: flareTheme.colors.dangerText,
    fontSize: 14,
    lineHeight: 20,
  },
  composerCard: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
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
    minHeight: 90,
  },
  composerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryActionButton: {
    flexGrow: 1,
    minHeight: 46,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  secondaryActionButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryActionButton: {
    flexGrow: 1,
    minHeight: 46,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primary,
  },
  primaryActionButtonDisabled: {
    backgroundColor: flareTheme.colors.primaryMutedStrong,
  },
  primaryActionButtonLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  addButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primaryMuted,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonLabel: {
    color: flareTheme.colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionCard: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  sectionMeta: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingText: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBlock: {
    gap: 10,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlineButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  inlineButtonLabel: {
    color: flareTheme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  emptyStateTitle: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyStateCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionCard: {
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  actionHeader: {
    gap: 8,
  },
  actionHeaderCopy: {
    gap: 4,
  },
  actionPosition: {
    color: flareTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  actionTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  actionDescription: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionOrderMeta: {
    color: flareTheme.colors.textSubtle,
    fontSize: 12,
  },
  removeButtonLabel: {
    color: flareTheme.colors.dangerText,
    fontSize: 13,
    fontWeight: "700",
  },
  templateGroup: {
    gap: 10,
  },
  templateGroupTitle: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  templateList: {
    gap: 10,
  },
  templateCard: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  templateCardSelected: {
    borderColor: flareTheme.colors.primaryBright,
    backgroundColor: flareTheme.colors.primaryMuted,
  },
  templateHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  templateTitle: {
    flex: 1,
    minWidth: 0,
    color: flareTheme.colors.textStrong,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  templateState: {
    color: flareTheme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  templateStateSelected: {
    color: flareTheme.colors.successText,
  },
  templateDescription: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  helperCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: 12,
  },
  closeFooterButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  closeFooterButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  limitText: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
