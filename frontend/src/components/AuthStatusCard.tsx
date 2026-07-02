import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { readFlareAuthRedirectUrl } from "../services/flareSupabaseAuth";
import { useFlareAuth } from "../state/FlareAuthContext";

function getConnectionLabel(
  authStatus: "loading" | "ready",
  authState: ReturnType<typeof useFlareAuth>["authState"],
) {
  if (authStatus === "loading") {
    return "Checking connection";
  }

  if (authState.kind === "authenticated") {
    return "Connected";
  }

  return "Local-only";
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

  const connectionLabel = useMemo(
    () => getConnectionLabel(authStatus, authState),
    [authState, authStatus],
  );
  const redirectUrl = useMemo(() => readFlareAuthRedirectUrl(), []);
  const isBusy = pendingAction !== null;
  const canSubmitPassword =
    !isBusy && email.trim().length > 0 && password.length > 0;
  const canSendMagicLink = !isBusy && email.trim().length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Setup persistence</Text>
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

      {authStatus === "loading" ? (
        <Text style={styles.copy}>
          Checking whether a real Supabase session is available for setup
          persistence.
        </Text>
      ) : null}

      {authStatus === "ready" && authState.kind === "authenticated" ? (
        <>
          <Text style={styles.copy}>
            Your setup can now reload on this device because Behavior Pattern
            and Anchor Note save to your signed-in Supabase account.
          </Text>
          <Text style={styles.detail}>
            Signed in as {authState.userEmail ?? authState.userId}
          </Text>
          <Text style={styles.detail}>
            Flare is a self-support tool. It does not monitor you in real time
            or contact anyone for you.
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
              {pendingAction === "sign-out" ? "Signing out..." : "Sign out"}
            </Text>
          </Pressable>
        </>
      ) : null}

      {authStatus === "ready" && authState.kind === "client-unavailable" ? (
        <>
          <Text style={styles.copy}>
            Setup persistence is local-only because the public Supabase URL and
            anon key are not loaded into the Expo runtime.
          </Text>
          <Text style={styles.detail}>
            Flare does not monitor urgent risk or provide emergency response.
          </Text>
        </>
      ) : null}

      {authStatus === "ready" && authState.kind === "no-session" ? (
        <>
          <Text style={styles.copy}>
            Setup saves still work locally in memory, but they will not reload
            from Supabase until you authenticate.
          </Text>
          <Text style={styles.detail}>
            Flare is for self-support and reflection. It is not a crisis
            service, therapy replacement, or medical treatment.
          </Text>
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
                Existing account
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
                First-time setup
              </Text>
            </Pressable>
          </View>
          <Text style={styles.detail}>
            {mode === "sign-in"
              ? "Sign in is for an existing Supabase account on this project."
              : "Create account is the first-time setup path for a new Supabase user."}
          </Text>
          <TextInput
            accessibilityLabel="Auth email"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel="Auth password"
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Password for direct sign-in"
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
                  "Account created if sign-up is enabled. Check your email if confirmation is required.",
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
                  ? "Signing in..."
                  : pendingAction === "sign-up"
                    ? "Creating..."
                    : mode === "sign-in"
                      ? "Sign in"
                      : "Create account"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canSendMagicLink}
              onPress={() => {
                setNotice(
                  redirectUrl
                    ? `Magic link sent if email auth is enabled. It should return to ${redirectUrl}.`
                    : "Magic link sent if email auth is enabled. Without EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL, Supabase falls back to the project Site URL.",
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
                  ? "Sending..."
                  : "Send magic link"}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.detail}>
            Password sign-in uses the current Supabase project settings. Magic
            link requires the configured redirect URL to be allowed in Supabase.
          </Text>
          <Text style={styles.detail}>
            {redirectUrl
              ? `Current redirect URL: ${redirectUrl}`
              : "Current redirect URL: not configured. Supabase may redirect to the project Site URL instead."}
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
    gap: 12,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7dcc7",
    backgroundColor: "#fffdf8",
  },
  connectedBadge: {
    backgroundColor: "#d7eadc",
    color: "#24553a",
  },
  copy: {
    color: "#5d6b7b",
    fontSize: 14,
    lineHeight: 20,
  },
  detail: {
    color: "#7a5430",
    fontSize: 13,
    lineHeight: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  error: {
    color: "#a03228",
    fontSize: 13,
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dccfb8",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff9f1",
    color: "#1f2937",
  },
  localOnlyBadge: {
    backgroundColor: "#efe3d3",
    color: "#7a5430",
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dccfb8",
    backgroundColor: "#fff9f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: "#d6693d",
    backgroundColor: "#fbe6dd",
  },
  modeButtonLabel: {
    color: "#5b4635",
    fontSize: 13,
    fontWeight: "700",
  },
  modeButtonLabelActive: {
    color: "#8e3d17",
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  notice: {
    color: "#24553a",
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    borderColor: "#d6693d",
    backgroundColor: "#d6693d",
  },
  primaryButtonLabel: {
    color: "#fffaf3",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderColor: "#dccfb8",
    backgroundColor: "#fff9f1",
  },
  secondaryButtonLabel: {
    color: "#5b4635",
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#1f2937",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
});
