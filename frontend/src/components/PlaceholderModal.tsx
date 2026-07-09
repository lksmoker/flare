import { PropsWithChildren } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import flareContent from "../content/flareContent.json";
import { flareTheme } from "../theme/flareTheme";

type PlaceholderModalProps = PropsWithChildren<{
  footer?: React.ReactNode;
  onClose: () => void;
  scrollContentContainerStyle?: StyleProp<ViewStyle>;
  showCloseButton?: boolean;
  subtitle?: string;
  title: string;
  visible: boolean;
}>;

export function PlaceholderModal({
  children,
  footer,
  onClose,
  scrollContentContainerStyle,
  showCloseButton = true,
  subtitle,
  title,
  visible,
}: PlaceholderModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent
      visible={visible}
    >
      <SafeAreaView edges={["top", "bottom"]} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {showCloseButton ? (
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonLabel}>
                  {flareContent.common.modal.close}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.contentContainer,
              scrollContentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.scrollBody}
          >
            <View style={styles.content}>{children}</View>
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: flareTheme.colors.overlay,
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: flareTheme.colors.surface,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: flareTheme.colors.border,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: flareTheme.colors.textStrong,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: flareTheme.colors.textMuted,
  },
  closeButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  closeButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  scrollBody: {
    flexGrow: 0,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  content: {
    gap: 12,
  },
  footer: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
});
