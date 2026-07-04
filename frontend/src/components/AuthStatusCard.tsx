import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { readFlareAuthRedirectUrl } from "../services/flareSupabaseAuth";
import { useFlareAuth } from "../state/FlareAuthContext";
import { flareTheme } from "../theme/flareTheme";

function getConnectionLabel(
  authStatus: "loading" | "ready",
  authState: ReturnType<typeof useFlareAuth>["authState"],
) {
  if (authStatus === "loading") {
    return flareContent.common.states.loading.checkingConnection;
  }

  if (authState.kind === "authenticated") {
    return flareContent.auth.status.connected;
  }

  return flareContent.auth.status.localOnly;
}

export function AuthStatusCard() {
  const {
    authState,
    authStatus,
    errorMessage,
    pendingAction,
    sendMagicLink,
    signInWithPassword,
    signOut,
    signUp,
  } = useFlareAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [isSignedInExpanded, setIsSignedInExpanded] = useState(false);

  const connectionLabel = useMemo(
    () => getConnectionLabel(authStatus, authState),
    [authState, authStatus],
  );
  const redirectUrl = useMemo(() => readFlareAuthRedirectUrl(), []);
  const isBusy = pendingAction !== null;
  const canSubmitPassword =
    !isBusy && email.trim().length > 0 && password.length > 0;
  const canSendMagicLink = !isBusy && email.trim().length > 0;
  const signedInUserLabel =
    authState.kind === "authenticated"
      ? `${flareContent.auth.authenticated.signedInAs} ${authState.userEmail ?? authState.userId}`
      : null;

  useEffect(() => {
    if (authState.kind === "authenticated") {
      setIsSignedInExpanded(false);
    }
  }, [authState.kind, authState.kind === "authenticated" ? authState.userId : null]);

  return (
    <View style={styles.card}>
      {authStatus === "ready" && authState.kind === "authenticated" ? (
        <View style={styles.disclosureMain}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{flareContent.auth.cardTitle}</Text>
            <Text style={[styles.statusBadge, styles.connectedBadge]}>
              {connectionLabel}
            </Text>
          </View>
          <View style={styles.disclosureMetaRow}>
            {signedInUserLabel ? (
              <Text style={[styles.detail, styles.signedInUserLabel]}>
                {signedInUserLabel}
              </Text>
            ) : (
              <View style={styles.disclosureMetaSpacer} />
            )}
            <Pressable
              accessibilityLabel={
                isSignedInExpanded
                  ? flareContent.auth.authenticated.collapseAccessibilityLabel
                  : flareContent.auth.authenticated.expandAccessibilityLabel
              }
              accessibilityRole="button"
              accessibilityState={{ expanded: isSignedInExpanded }}
              aria-expanded={isSignedInExpanded}
              onPress={() => setIsSignedInExpanded((current) => !current)}
              style={styles.disclosureButton}
            >
              <Text style={styles.disclosureText}>
                {isSignedInExpanded
                  ? flareContent.auth.authenticated.hideDetails
                  : flareContent.auth.authenticated.details}
              </Text>
              <Text style={styles.disclosureChevron}>
                {isSignedInExpanded ? "^" : "v"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.headerRow}>
          <Text style={styles.title}>{flareContent.auth.cardTitle}</Text>
          <Text
            style={[
              styles.statusBadge,
              authState.kind === "authenticated"
                ? styles.connectedBadge
                : styles.localOnlyBadge,
            ]}
          >
            {connectionLabel}
          </Text>
        </View>
      )}

      {authStatus === "loading" ? (
        <Text style={styles.copy}>
          {flareContent.auth.loading.copy}
        </Text>
      ) : null}

      {authStatus === "ready" && authState.kind === "authenticated" ? (
        <>
          {isSignedInExpanded ? (
            <>
              <Text style={styles.copy}>
                {flareContent.auth.authenticated.copy}
              </Text>
              <Text style={styles.detail}>
                {flareContent.safety.selfSupportBoundary}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setNotice(null);
                  void signOut();
                }}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={styles.secondaryButtonLabel}>
                  {pendingAction === "sign-out"
                    ? flareContent.auth.authenticated.signingOut
                    : flareContent.auth.authenticated.signOut}
                </Text>
              </Pressable>
            </>
          ) : null}
        </>
      ) : null}

      {authStatus === "ready" && authState.kind === "client-unavailable" ? (
        <>
          <Text style={styles.copy}>
            {flareContent.auth.clientUnavailable.copy}
          </Text>
          <Text style={styles.detail}>
            {flareContent.safety.noEmergencyResponse}
          </Text>
        </>
      ) : null}

      {authStatus === "ready" && authState.kind === "no-session" ? (
        <>
          <Text style={styles.copy}>
            {flareContent.auth.noSession.copy}
          </Text>
          <Text style={styles.detail}>{flareContent.safety.notCrisisCare}</Text>
          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode("sign-in");
                setNotice(null);
              }}
              style={[
                styles.modeButton,
                mode === "sign-in" ? styles.modeButtonActive : null,
              ]}
            >
              <Text
                style={[
                  styles.modeButtonLabel,
                  mode === "sign-in" ? styles.modeButtonLabelActive : null,
                ]}
              >
                {flareContent.auth.noSession.modes.existingAccount}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode("sign-up");
                setNotice(null);
              }}
              style={[
                styles.modeButton,
                mode === "sign-up" ? styles.modeButtonActive : null,
              ]}
            >
              <Text
                style={[
                  styles.modeButtonLabel,
                  mode === "sign-up" ? styles.modeButtonLabelActive : null,
                ]}
              >
                {flareContent.auth.noSession.modes.firstTimeSetup}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.detail}>
            {mode === "sign-in"
              ? flareContent.auth.noSession.modes.existingAccountDetail
              : flareContent.auth.noSession.modes.firstTimeSetupDetail}
          </Text>
          <TextInput
            accessibilityLabel={
              flareContent.auth.noSession.form.emailAccessibilityLabel
            }
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder={flareContent.auth.noSession.form.emailPlaceholder}
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel={
              flareContent.auth.noSession.form.passwordAccessibilityLabel
            }
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder={flareContent.auth.noSession.form.passwordPlaceholder}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmitPassword}
              onPress={() => {
                setNotice(null);
                if (mode === "sign-in") {
                  void signInWithPassword(email, password);
                  return;
                }

                setNotice(
                  flareContent.auth.noSession.signUpNotice,
                );
                void signUp(email, password);
              }}
              style={[
                styles.button,
                styles.primaryButton,
                !canSubmitPassword && styles.disabledButton,
              ]}
            >
              <Text style={styles.primaryButtonLabel}>
                {pendingAction === "password"
                  ? flareContent.auth.noSession.buttons.signingIn
                  : pendingAction === "sign-up"
                    ? flareContent.auth.noSession.buttons.creating
                    : mode === "sign-in"
                      ? flareContent.auth.noSession.buttons.signIn
                      : flareContent.auth.noSession.buttons.createAccount}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSendMagicLink}
              onPress={() => {
                setNotice(
                  redirectUrl
                    ? `${flareContent.auth.noSession.redirectMagicLinkPrefix} ${redirectUrl}.`
                    : flareContent.auth.noSession.redirectMagicLinkFallback,
                );
                void sendMagicLink(email);
              }}
              style={[
                styles.button,
                styles.secondaryButton,
                !canSendMagicLink && styles.disabledButton,
              ]}
            >
              <Text style={styles.secondaryButtonLabel}>
                {pendingAction === "magic-link"
                  ? flareContent.auth.noSession.buttons.sending
                  : flareContent.auth.noSession.buttons.sendMagicLink}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.detail}>{flareContent.auth.noSession.passwordHint}</Text>
          <Text style={styles.detail}>
            {redirectUrl
              ? `${flareContent.auth.noSession.redirectLabel} ${redirectUrl}`
              : flareContent.common.states.error.missingRedirectUrl}
          </Text>
        </>
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
  },
  card: {
    ...flareTheme.shadows.card,
    gap: 12,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  connectedBadge: {
    backgroundColor: flareTheme.colors.successBg,
    color: flareTheme.colors.successText,
  },
  copy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  disclosureButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  disclosureChevron: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 12,
    fontWeight: "700",
  },
  disclosureMain: {
    gap: 8,
  },
  detail: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  disclosureMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  disclosureMetaSpacer: {
    flex: 1,
  },
  disclosureText: {
    color: flareTheme.colors.primaryStrong,
    fontSize: 13,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  error: {
    color: flareTheme.colors.dangerText,
    fontSize: 13,
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: flareTheme.colors.surfaceStrong,
    color: flareTheme.colors.textStrong,
  },
  localOnlyBadge: {
    backgroundColor: flareTheme.colors.neutralBg,
    color: flareTheme.colors.neutralText,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: flareTheme.colors.borderStrong,
    backgroundColor: flareTheme.colors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: flareTheme.colors.primary,
    backgroundColor: flareTheme.colors.primaryMuted,
  },
  modeButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  modeButtonLabelActive: {
    color: flareTheme.colors.primaryStrong,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  notice: {
    color: flareTheme.colors.successText,
    fontSize: 13,
    lineHeight: 18,
  },
  signedInUserLabel: {
    flex: 1,
  },
  primaryButton: {
    borderColor: flareTheme.colors.primary,
    backgroundColor: flareTheme.colors.primary,
  },
  primaryButtonLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderColor: flareTheme.colors.borderStrong,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  secondaryButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
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
  title: {
    color: flareTheme.colors.textStrong,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
});
