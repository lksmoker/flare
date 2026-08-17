import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { flareTheme } from "../theme/flareTheme";

type AppNavigationProps = {
  currentPath: "/" | "/history" | "/customize";
};

const navigationItems = [
  { href: "/" as const, ...flareContent.navigation.flare },
  { href: "/history" as const, ...flareContent.navigation.history },
  { href: "/customize" as const, ...flareContent.navigation.customize },
];

export function AppNavigation({ currentPath }: AppNavigationProps) {
  return (
    <View style={styles.row}>
      {navigationItems.map((item) => {
        const isActive = item.href === currentPath;
        const tabStyle = StyleSheet.flatten([
          styles.tab,
          isActive ? styles.activeTab : styles.inactiveTab,
        ]);

        return (
          <Link key={item.href} href={item.href} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityState={{ selected: isActive }}
              style={tabStyle}
            >
              <View style={styles.tabCopy}>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.tabHint,
                    isActive ? styles.activeTabHint : styles.inactiveTabHint,
                  ]}
                >
                  {item.hint}
                </Text>
              </View>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabCopy: {
    alignItems: "center",
    gap: 2,
  },
  activeTab: {
    borderColor: flareTheme.colors.primaryStrong,
    backgroundColor: flareTheme.colors.primary,
  },
  inactiveTab: {
    borderColor: flareTheme.colors.borderStrong,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  tabHint: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  activeTabLabel: {
    color: flareTheme.colors.onPrimary,
  },
  activeTabHint: {
    color: flareTheme.colors.onPrimary,
    opacity: 0.9,
  },
  inactiveTabLabel: {
    color: flareTheme.colors.textMuted,
  },
  inactiveTabHint: {
    color: flareTheme.colors.textSubtle,
  },
});
