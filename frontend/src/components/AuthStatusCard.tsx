import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
  const { authState, authStatus, errorMessage, pendingAction, sendMagicLink, signInWithPassword, signOut } =
    useFlareAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const connectionLabel = useMemo(
    () => getConnectionLabel(authStatus, authState),
    [authState, authStatus],
  );
  const isBusy = pendingAction !== null;

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
            Behavior Pattern and Anchor Note now save against your authenticated
            Supabase user instead of staying local-only for this app session.
          </Text>
          <Text style={styles.detail}>
            Signed in as {authState.userEmail ?? authState.userId}
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
        <Text style={styles.copy}>
          Setup persistence is local-only because the public Supabase URL and
          anon key are not loaded into the Expo runtime.
        </Text>
      ) : null}

      {authStatus === "ready" && authState.kind === "no-session" ? (
        <>
          <Text style={styles.copy}>
            Setup saves still work locally in memory, but they will not reload
            from Supabase until you authenticate.
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
              disabled={isBusy || email.trim().length === 0 || password.length === 0}
              onPress={() => {
                setNotice(null);
                void signInWithPassword(email, password);
              }}
              style={[
                styles.button,
                styles.primaryButton,
                (isBusy || email.trim().length === 0 || password.length === 0) &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.primaryButtonLabel}>
                {pendingAction === "password" ? "Signing in..." : "Sign in"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isBusy || email.trim().length === 0}
              onPress={() => {
                setNotice("Magic link sent if email auth is enabled.");
                void sendMagicLink(email);
              }}
              style={[
                styles.button,
                styles.secondaryButton,
                (isBusy || email.trim().length === 0) && styles.disabledButton,
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
            link is available as a minimal fallback if email auth is enabled.
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
