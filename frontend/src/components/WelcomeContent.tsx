import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import type { FlareSupabaseAuthState } from "../services/flareSupabaseAuth";
import { flareTheme } from "../theme/flareTheme";

type WelcomeContentProps = {
  authState: FlareSupabaseAuthState;
  authStatus: "loading" | "ready";
  onGetStarted?: () => void;
  onSignIn?: () => void;
};

function getSignInStateCopy(
  authStatus: "loading" | "ready",
  authState: FlareSupabaseAuthState,
) {
  if (authStatus !== "ready") {
    return flareContent.screens.welcome.sections.signedInCopy;
  }

  if (authState.kind === "authenticated") {
    return flareContent.screens.welcome.sections.alreadySignedInCopy;
  }

  if (authState.kind === "client-unavailable") {
    return flareContent.screens.welcome.sections.clientUnavailableCopy;
  }

  return flareContent.screens.welcome.sections.signedInCopy;
}

export function WelcomeContent({
  authState,
  authStatus,
  onGetStarted,
  onSignIn,
}: WelcomeContentProps) {
  const showSignInAction =
    authStatus === "ready" && authState.kind === "no-session" && onSignIn;

  return (
    <View style={styles.stack}>
      <View style={styles.heroBlock}>
        <Text style={styles.screenLabel}>
          {flareContent.screens.welcome.screenLabel}
        </Text>
        <Text style={styles.title}>{flareContent.screens.welcome.title}</Text>
        <Text style={styles.subtitle}>
          {flareContent.screens.welcome.subtitle}
        </Text>
        <Text style={styles.intro}>{flareContent.screens.welcome.intro}</Text>
      </View>

      <View style={styles.promiseBlock}>
        <View style={styles.promiseRow}>
          <View style={styles.promiseMarker} />
          <View style={styles.promiseCopyBlock}>
            <Text style={styles.sectionTitle}>
              {flareContent.screens.welcome.sections.supportTitle}
            </Text>
            <Text style={styles.sectionCopy}>
              {flareContent.screens.welcome.sections.supportCopy}
            </Text>
          </View>
        </View>

        <View style={styles.promiseRow}>
          <View style={styles.promiseMarker} />
          <View style={styles.promiseCopyBlock}>
            <Text style={styles.sectionTitle}>
              {flareContent.screens.welcome.sections.clarityTitle}
            </Text>
            <Text style={styles.sectionCopy}>
              {flareContent.screens.welcome.sections.clarityCopy}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.nextStepBlock}>
        <Text style={styles.sectionEyebrow}>
          {flareContent.screens.welcome.sections.nextStepTitle}
        </Text>
        <Text style={styles.nextStepCopy}>
          {flareContent.screens.welcome.sections.nextStepCopy}
        </Text>

        {onGetStarted ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onGetStarted}
              style={styles.primaryAction}
            >
              <Text style={styles.primaryActionLabel}>
                {flareContent.screens.welcome.actions.primary}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.accountBlock}>
        <Text style={styles.sectionEyebrow}>
          {flareContent.screens.welcome.sections.signedInTitle}
        </Text>
        <Text style={styles.sectionCopy}>
          {getSignInStateCopy(authStatus, authState)}
        </Text>
        {showSignInAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionLabel}>
              {flareContent.screens.welcome.actions.signIn}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accountBlock: {
    gap: 10,
    paddingTop: 4,
  },
  actions: {
    paddingTop: 8,
  },
  heroBlock: {
    gap: 10,
  },
  intro: {
    color: flareTheme.colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  nextStepBlock: {
    gap: 10,
    paddingTop: 8,
  },
  nextStepCopy: {
    color: flareTheme.colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  primaryAction: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: flareTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryActionLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  promiseBlock: {
    gap: 18,
    paddingVertical: 6,
  },
  promiseCopyBlock: {
    flex: 1,
    gap: 6,
  },
  promiseMarker: {
    width: 10,
    alignSelf: "stretch",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primaryMuted,
  },
  promiseRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  screenLabel: {
    color: flareTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionEyebrow: {
    color: flareTheme.colors.textSubtle,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
  },
  secondaryAction: {
    alignSelf: "flex-start",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    paddingBottom: 8,
  },
  secondaryActionLabel: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 14,
    fontWeight: "700",
  },
  stack: {
    gap: 28,
  },
  subtitle: {
    color: flareTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
  },
  title: {
    color: flareTheme.colors.textStrong,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "800",
  },
});
