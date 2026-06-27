import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type PlaceholderModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  subtitle: string;
  title: string;
  visible: boolean;
};

export function PlaceholderModal({
  children,
  onClose,
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
      <View style={styles.overlay}>
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
          <View style={styles.content}>{children}</View>
        </View>
      </View>
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
    gap: 18,
    minHeight: "58%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#fffaf4",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
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
  content: {
    gap: 12,
  },
});
