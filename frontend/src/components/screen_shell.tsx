import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
}>;

export function ScreenShell({
  children,
  eyebrow,
  title,
  subtitle,
}: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
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
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#fff9f1",
    borderWidth: 1,
    borderColor: "#e7dcc7",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#8a5a2b",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },
});
