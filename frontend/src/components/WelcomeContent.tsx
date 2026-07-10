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
    return flareContent.screens.welcome.sections.withoutSignInCopy;
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

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {flareContent.screens.welcome.sections.withoutSignInTitle}
        </Text>
        <Text style={styles.sectionCopy}>
          {flareContent.screens.welcome.sections.withoutSignInCopy}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {flareContent.screens.welcome.sections.signedInTitle}
        </Text>
        <Text style={styles.sectionCopy}>
          {getSignInStateCopy(authStatus, authState)}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {flareContent.screens.welcome.sections.nextStepTitle}
        </Text>
        <Text style={styles.sectionCopy}>
          {flareContent.screens.welcome.sections.nextStepCopy}
        </Text>
      </View>

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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
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
  screenLabel: {
    color: flareTheme.colors.primaryBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionCard: {
    gap: 8,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  sectionCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: flareTheme.colors.textStrong,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryAction: {
    alignSelf: "center",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryActionLabel: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 14,
    fontWeight: "700",
  },
  stack: {
    gap: 16,
  },
  subtitle: {
    color: flareTheme.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    color: flareTheme.colors.textStrong,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
});
