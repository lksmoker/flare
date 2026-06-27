import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerCopy}>
            <Text style={styles.appTitle}>Flare</Text>
            <Text style={styles.screenLabel}>{screenLabel}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <AppNavigation currentPath={currentPath} />
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3ede2",
  },
  content: {
    padding: 20,
    gap: 18,
  },
  headerCard: {
    gap: 18,
    padding: 20,
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
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#526071",
  },
});
