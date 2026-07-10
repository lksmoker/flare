import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WelcomeContent } from "../components/WelcomeContent";
import { useFlareAuth } from "../state/FlareAuthContext";
import { flareTheme } from "../theme/flareTheme";
import { FlareScreen } from "./FlareScreen";
import {
  readWelcomeCompletion,
  writeWelcomeCompletion,
} from "../services/welcomeState";

export function WelcomeGateScreen() {
  const router = useRouter();
  const { authState, authStatus } = useFlareAuth();
  const [isWelcomeResolved, setIsWelcomeResolved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function resolveWelcomeState() {
      if (authStatus !== "ready") {
        return;
      }

      if (authState.kind === "authenticated") {
        await writeWelcomeCompletion();
        if (isActive) {
          setShowWelcome(false);
          setIsWelcomeResolved(true);
        }
        return;
      }

      const hasCompletedWelcome = await readWelcomeCompletion();

      if (!isActive) {
        return;
      }

      setShowWelcome(!hasCompletedWelcome);
      setIsWelcomeResolved(true);
    }

    void resolveWelcomeState();

    return () => {
      isActive = false;
    };
  }, [authState.kind, authStatus]);

  if (!isWelcomeResolved) {
    return <SafeAreaView style={styles.loadingScreen} />;
  }

  if (!showWelcome) {
    return <FlareScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.inner}>
          <View style={styles.heroCard}>
            <WelcomeContent
              authState={authState}
              authStatus={authStatus}
              onGetStarted={() => {
                setShowWelcome(false);
                void writeWelcomeCompletion();
              }}
              onSignIn={() => {
                router.push("/customize?focus=auth");
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  heroCard: {
    ...flareTheme.shadows.hero,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  inner: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: flareTheme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: flareTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
});
