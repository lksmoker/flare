import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import { flareTheme } from "../theme/flareTheme";

type AppNavigationProps = {
  currentPath: "/" | "/history" | "/customize";
};

const navigationItems = [
  { href: "/" as const, label: flareContent.navigation.flare },
  { href: "/history" as const, label: flareContent.navigation.history },
  { href: "/customize" as const, label: flareContent.navigation.customize },
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
            <Pressable accessibilityRole="button" style={tabStyle}>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
              >
                {item.label}
              </Text>
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
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
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
  activeTabLabel: {
    color: flareTheme.colors.onPrimary,
  },
  inactiveTabLabel: {
    color: flareTheme.colors.textMuted,
  },
});
