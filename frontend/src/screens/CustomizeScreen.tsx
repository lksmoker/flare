import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { AnchorNoteSetupModal } from "../components/AnchorNoteSetupModal";
import { AnchorNoteSummary } from "../components/AnchorNoteSummary";
import { AuthStatusCard } from "../components/AuthStatusCard";
import { BehaviorPatternSetupModal } from "../components/BehaviorPatternSetupModal";
import { BehaviorPatternSummary } from "../components/BehaviorPatternSummary";
import { FlarePlanSetupModal } from "../components/FlarePlanSetupModal";
import { PlaceholderModal } from "../components/PlaceholderModal";
import { SupportChannelSetupModal } from "../components/SupportChannelSetupModal";
import { WelcomeContent } from "../components/WelcomeContent";
import flareContent from "../content/flareContent.json";
import { readAccessTokenFromCurrentUrl } from "../services/supportChannelApi";
import { useFlareAuth } from "../state/FlareAuthContext";
import { useAnchorNote } from "../state/AnchorNoteContext";
import { useBehaviorPattern } from "../state/BehaviorPatternContext";
import { useFlarePlan } from "../state/FlarePlanContext";
import { useSupportChannelStatus } from "../state/useSupportChannelStatus";
import { flareTheme } from "../theme/flareTheme";
import type { FlareReadinessFocus } from "./flareReadiness";

function normalizeFocusParam(
  focus: string | string[] | undefined,
): FlareReadinessFocus | null {
  const nextFocus = Array.isArray(focus) ? focus[0] : focus;

  switch (nextFocus) {
    case "auth":
    case "anchor-note":
    case "behavior-pattern":
    case "flare-plan":
    case "support-channel":
      return nextFocus;
    default:
      return null;
  }
}

export function CustomizeScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string | string[] }>();
  const [isBehaviorPatternVisible, setIsBehaviorPatternVisible] =
    useState(false);
  const [isAnchorNoteVisible, setIsAnchorNoteVisible] = useState(false);
  const [isFlarePlanVisible, setIsFlarePlanVisible] = useState(false);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isSupportChannelVisible, setIsSupportChannelVisible] = useState(
    () => Boolean(readAccessTokenFromCurrentUrl()),
  );
  const { authState, authStatus } = useFlareAuth();
  const { behaviorPattern, isConfigured } = useBehaviorPattern();
  const { anchorNote, isConfigured: isAnchorNoteConfigured } = useAnchorNote();
  const {
    isInitialLoading,
    isPlanConfigured,
    isUsingBuiltInDefaultPlan,
    plan,
  } = useFlarePlan();
  const {
    isSupportChannelConfigured,
    isSupportChannelLoading,
    replaceSupportChannelStatus,
  } = useSupportChannelStatus();
  const requestedFocus = normalizeFocusParam(focus);

  useEffect(() => {
    if (requestedFocus === "behavior-pattern") {
      setIsBehaviorPatternVisible(true);
      return;
    }

    if (requestedFocus === "anchor-note") {
      setIsAnchorNoteVisible(true);
      return;
    }

    if (requestedFocus === "flare-plan") {
      setIsFlarePlanVisible(true);
      return;
    }

    if (requestedFocus === "support-channel") {
      setIsSupportChannelVisible(true);
    }
  }, [requestedFocus]);

  return (
    <AppShell
      currentPath="/customize"
      screenLabel={flareContent.screens.customize.screenLabel}
      subtitle={flareContent.screens.customize.subtitle}
      title={flareContent.screens.customize.title}
    >
      <View style={styles.stack}>
        <AuthStatusCard />

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsWelcomeVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.screens.customize.aboutFlare.title}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.screens.customize.aboutFlare.copy}
          </Text>
          <Text style={styles.linkLabel}>
            {flareContent.screens.customize.aboutFlare.action}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsBehaviorPatternVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.behaviorPattern.cardTitle}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                isConfigured ? styles.readyBadge : styles.pendingBadge,
              ]}
            >
              {isConfigured
                ? flareContent.common.status.configured
                : flareContent.common.status.needsSetup}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.behaviorPattern.cardCopy}
          </Text>
          <BehaviorPatternSummary behaviorPattern={behaviorPattern} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsAnchorNoteVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.anchorNote.cardTitle}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                isAnchorNoteConfigured ? styles.readyBadge : styles.pendingBadge,
              ]}
            >
              {isAnchorNoteConfigured
                ? flareContent.common.status.configured
                : flareContent.common.status.needsSetup}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.anchorNote.cardCopy}
          </Text>
          <AnchorNoteSummary anchorNote={anchorNote} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsFlarePlanVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.flarePlan.cardTitle}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                isUsingBuiltInDefaultPlan || isPlanConfigured
                  ? styles.readyBadge
                  : styles.pendingBadge,
              ]}
            >
              {isInitialLoading
                ? flareContent.components.flarePlan.loading.checking
                : isUsingBuiltInDefaultPlan
                  ? flareContent.components.flarePlan.builtInDefaultStatus
                : isPlanConfigured
                  ? flareContent.common.status.configured
                  : flareContent.components.flarePlan.notConfigured}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.flarePlan.cardCopy}
          </Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {isUsingBuiltInDefaultPlan
                ? flareContent.components.flarePlan.builtInDefaultSummaryTitle
                : isPlanConfigured
                ? flareContent.components.flarePlan.summaryConfigured
                : flareContent.components.flarePlan.summaryEmptyTitle}
            </Text>
            <Text style={styles.summaryCopy}>
              {isInitialLoading
                ? flareContent.components.flarePlan.loading.initial
                : isUsingBuiltInDefaultPlan
                  ? flareContent.components.flarePlan.builtInDefaultSummaryCopy
                : `${plan?.active_action_count ?? 0} of ${plan?.maximum_active_actions ?? 10} actions`}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsSupportChannelVisible(true)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.cardTitle}
            </Text>
            <Text
              style={[
                styles.statusBadge,
                isSupportChannelConfigured ? styles.readyBadge : styles.pendingBadge,
              ]}
            >
              {isSupportChannelLoading
                ? flareContent.common.states.loading.checkingConnection
                : isSupportChannelConfigured
                  ? flareContent.common.status.configured
                  : flareContent.components.supportChannel.status.notConfigured}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.supportChannel.cardCopy}
          </Text>
        </Pressable>
      </View>

      <BehaviorPatternSetupModal
        onClose={() => setIsBehaviorPatternVisible(false)}
        visible={isBehaviorPatternVisible}
      />
      <AnchorNoteSetupModal
        onClose={() => setIsAnchorNoteVisible(false)}
        visible={isAnchorNoteVisible}
      />
      <FlarePlanSetupModal
        onClose={() => setIsFlarePlanVisible(false)}
        visible={isFlarePlanVisible}
      />
      <SupportChannelSetupModal
        onClose={() => setIsSupportChannelVisible(false)}
        onStatusChange={replaceSupportChannelStatus}
        visible={isSupportChannelVisible}
      />
      <PlaceholderModal
        onClose={() => setIsWelcomeVisible(false)}
        title={flareContent.screens.customize.aboutFlare.action}
        visible={isWelcomeVisible}
      >
        <WelcomeContent authState={authState} authStatus={authStatus} />
      </PlaceholderModal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  card: {
    ...flareTheme.shadows.card,
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flexShrink: 1,
    color: flareTheme.colors.textStrong,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  cardCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  linkLabel: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryCard: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  summaryTitle: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
});
