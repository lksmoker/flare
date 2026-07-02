import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import flareContent from "../content/flareContent.json";
import { AppNavigation } from "./AppNavigation";

type AppShellProps = PropsWithChildren<{
  currentPath: "/" | "/history" | "/customize";
  screenLabel: string;
  title: string;
  subtitle: string;
}>;

export function AppShell({
  children,
  currentPath,
  screenLabel,
  title,
  subtitle,
}: AppShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.inner}>
          <View style={styles.headerCard}>
            <View style={styles.headerCopy}>
              <Text style={styles.appTitle}>{flareContent.app.name}</Text>
              <Text style={styles.screenLabel}>{screenLabel}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <AppNavigation currentPath={currentPath} />
          </View>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3ede2",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 16,
  },
  headerCard: {
    gap: 18,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "#fff9f1",
    borderWidth: 1,
    borderColor: "#e7dcc7",
  },
  headerCopy: {
    gap: 6,
  },
  appTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: "#1f2937",
  },
  screenLabel: {
    color: "#8a5a2b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#526071",
  },
});
