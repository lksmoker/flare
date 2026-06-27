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

type PlaceholderModalProps = PropsWithChildren<{
  footer?: React.ReactNode;
  onClose: () => void;
  scrollContentContainerStyle?: StyleProp<ViewStyle>;
  subtitle: string;
  title: string;
  visible: boolean;
}>;

export function PlaceholderModal({
  children,
  footer,
  onClose,
  scrollContentContainerStyle,
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
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
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
    backgroundColor: "rgba(31, 41, 55, 0.4)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#fffaf4",
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
    borderBottomColor: "#efe3d3",
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
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#526071",
  },
  closeButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#efe3d3",
  },
  closeButtonLabel: {
    color: "#5b4635",
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
    borderTopColor: "#efe3d3",
    backgroundColor: "#fffaf4",
  },
});
