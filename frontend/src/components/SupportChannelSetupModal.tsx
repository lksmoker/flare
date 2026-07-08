import { useEffect, useMemo, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";

import flareContent from "../content/flareContent.json";
import {
  clearSupportChannelCallbackParams,
  completeGroupMeConnect,
  configureSupportChannel,
  DEFAULT_SUPPORT_CHANNEL_MESSAGE,
  disableSupportChannel,
  getSupportChannel,
  listGroupMeDestinations,
  readAccessTokenFromCurrentUrl,
  readAccessTokenFromUrl,
  reconnectSupportChannel,
  sendSupportChannelTest,
  startGroupMeConnect,
  SupportChannel,
  SupportChannelApiError,
  SupportChannelDestination,
  SupportChannelTestResult,
} from "../services/supportChannelApi";
import { useFlareAuth } from "../state/FlareAuthContext";
import { flareTheme } from "../theme/flareTheme";
import { PlaceholderModal } from "./PlaceholderModal";

type SupportChannelSetupModalProps = {
  onClose: () => void;
  onStatusChange?: (channel: SupportChannel | null) => void;
  visible: boolean;
};

function getStatusLabel(channel: SupportChannel | null) {
  if (!channel) {
    return flareContent.components.supportChannel.status.notConfigured;
  }

  if (channel.status === "disabled" || !channel.enabled) {
    return flareContent.components.supportChannel.status.disabled;
  }

  if (
    channel.status === "reconnect_required" ||
    channel.status === "disconnected"
  ) {
    return flareContent.components.supportChannel.status.reconnectRequired;
  }

  if (channel.configured) {
    return flareContent.components.supportChannel.status.enabled;
  }

  return flareContent.components.supportChannel.status.connecting;
}

function getStatusBadgeStyle(channel: SupportChannel | null) {
  if (!channel) {
    return styles.pendingBadge;
  }

  if (channel.status === "disabled" || !channel.enabled) {
    return styles.neutralBadge;
  }

  if (
    channel.status === "reconnect_required" ||
    channel.status === "disconnected"
  ) {
    return styles.warningBadge;
  }

  return styles.readyBadge;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function getLastDeliveryLabel(
  channel: SupportChannel | null,
  lastTestResult: SupportChannelTestResult | null,
) {
  if (lastTestResult) {
    return `${flareContent.components.supportChannel.labels.lastTest}: ${lastTestResult.status}`;
  }

  if (!channel?.last_delivery_status) {
    return flareContent.components.supportChannel.lastDelivery.empty;
  }

  const timestamp = formatTimestamp(channel.last_delivery_at);

  return timestamp
    ? `${channel.last_delivery_status} · ${timestamp}`
    : channel.last_delivery_status;
}

export function SupportChannelSetupModal({
  onClose,
  onStatusChange,
  visible,
}: SupportChannelSetupModalProps) {
  const { authState, authStatus } = useFlareAuth();
  const [channel, setChannel] = useState<SupportChannel | null>(null);
  const [destinations, setDestinations] = useState<SupportChannelDestination[]>(
    [],
  );
  const [connectSessionId, setConnectSessionId] = useState<string | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [lastTestResult, setLastTestResult] =
    useState<SupportChannelTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCompletingConnection, setIsCompletingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const reconnectRequestedRef = useRef(false);
  const hasHandledCallbackRef = useRef(false);

  const authBlocked =
    authStatus !== "ready" || authState.kind !== "authenticated";
  const showDestinationPicker =
    destinations.length > 0 && Boolean(connectSessionId);
  const selectedDestination = useMemo(
    () =>
      destinations.find((destination) => destination.id === selectedDestinationId) ??
      null,
    [destinations, selectedDestinationId],
  );

  async function loadChannel() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextChannel = await getSupportChannel();
      setChannel(nextChannel);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : flareContent.components.supportChannel.errors.loadFailed,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCallbackToken(accessToken: string) {
    if (
      !accessToken ||
      hasHandledCallbackRef.current ||
      authBlocked
    ) {
      return;
    }

    hasHandledCallbackRef.current = true;
    setIsCompletingConnection(true);
    setErrorMessage(null);
    setNotice(flareContent.components.supportChannel.notice.finishingConnection);

    try {
      const connection = await completeGroupMeConnect(accessToken);
      setConnectSessionId(connection.connect_session_id);
      const nextDestinations = await listGroupMeDestinations(
        connection.connect_session_id,
      );
      setDestinations(nextDestinations);
      setSelectedDestinationId(nextDestinations[0]?.id ?? null);
      setNotice(flareContent.components.supportChannel.notice.chooseGroup);
      clearSupportChannelCallbackParams();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : flareContent.components.supportChannel.errors.connectFailed,
      );
      hasHandledCallbackRef.current = false;
    } finally {
      setIsCompletingConnection(false);
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    if (!visible || authBlocked) {
      return;
    }

    void loadChannel();
  }, [authBlocked, visible]);

  useEffect(() => {
    if (!visible || authBlocked) {
      return;
    }

    const currentUrlAccessToken = readAccessTokenFromCurrentUrl();
    if (currentUrlAccessToken) {
      void handleCallbackToken(currentUrlAccessToken);
    }

    let isActive = true;

    void Linking.getInitialURL().then((initialUrl) => {
      if (!isActive || !initialUrl) {
        return;
      }

      const accessToken = readAccessTokenFromUrl(initialUrl);
      if (accessToken) {
        void handleCallbackToken(accessToken);
      }
    });

    const subscription = Linking.addEventListener("url", (event) => {
      const accessToken = readAccessTokenFromUrl(event.url);
      if (accessToken) {
        void handleCallbackToken(accessToken);
      }
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [authBlocked, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setErrorMessage(null);
    setNotice(null);
    setLastTestResult(null);
  }, [visible]);

  async function startConnect(reconnect = false) {
    reconnectRequestedRef.current = reconnect;
    hasHandledCallbackRef.current = false;
    setIsConnecting(true);
    setErrorMessage(null);
    setNotice(flareContent.components.supportChannel.notice.redirecting);

    try {
      const response = await startGroupMeConnect();
      await Linking.openURL(response.auth_url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : flareContent.components.supportChannel.errors.connectFailed,
      );
      setIsConnecting(false);
    }
  }

  async function saveSelection() {
    if (!connectSessionId || !selectedDestinationId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const nextChannel = reconnectRequestedRef.current
        ? await reconnectSupportChannel({
            connectSessionId,
            defaultMessage: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
            enabled: true,
            externalGroupId: selectedDestinationId,
          })
        : await configureSupportChannel({
            connectSessionId,
            defaultMessage: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
            enabled: true,
            externalGroupId: selectedDestinationId,
          });
      setChannel(nextChannel);
      onStatusChange?.(nextChannel);
      setDestinations([]);
      setConnectSessionId(null);
      setSelectedDestinationId(null);
      reconnectRequestedRef.current = false;
      setNotice(flareContent.components.supportChannel.notice.saved);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : flareContent.components.supportChannel.errors.saveFailed,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function disableCurrentChannel() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const nextChannel = await disableSupportChannel();
      setChannel(nextChannel);
      onStatusChange?.(nextChannel);
      setNotice(flareContent.components.supportChannel.notice.disabled);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : flareContent.components.supportChannel.errors.disableFailed,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function sendTest() {
    setIsSendingTest(true);
    setErrorMessage(null);

    try {
      const result = await sendSupportChannelTest();
      setLastTestResult(result);
      setNotice(
        result.status === "sent"
          ? flareContent.components.supportChannel.notice.testSent
          : result.error_message_safe ??
              flareContent.components.supportChannel.errors.testFailed,
      );
      await loadChannel();
    } catch (error) {
      if (error instanceof SupportChannelApiError) {
        setNotice(error.message);
      } else {
        setErrorMessage(flareContent.components.supportChannel.errors.testFailed);
      }
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <PlaceholderModal
      onClose={onClose}
      subtitle={flareContent.components.supportChannel.modalSubtitle}
      title={flareContent.components.supportChannel.modalTitle}
      visible={visible}
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.currentStatus.title}
            </Text>
            <Text style={[styles.statusBadge, getStatusBadgeStyle(channel)]}>
              {getStatusLabel(channel)}
            </Text>
          </View>
          <Text style={styles.cardCopy}>
            {flareContent.components.supportChannel.currentStatus.copy}
          </Text>
          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {flareContent.components.supportChannel.labels.provider}
              </Text>
              <Text style={styles.detailValue}>
                {channel?.provider
                  ? flareContent.components.supportChannel.providers.groupme
                  : flareContent.components.supportChannel.providers.pending}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {flareContent.components.supportChannel.labels.group}
              </Text>
              <Text style={styles.detailValue}>
                {channel?.destination_display_name ??
                  flareContent.components.supportChannel.currentStatus.noGroup}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {flareContent.components.supportChannel.labels.lastDelivery}
              </Text>
              <Text style={styles.detailValue}>
                {getLastDeliveryLabel(channel, lastTestResult)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {flareContent.components.supportChannel.boundary.title}
          </Text>
          <Text style={styles.cardCopy}>
            {flareContent.components.supportChannel.boundary.copy}
          </Text>
          <Text style={styles.helperCopy}>
            {flareContent.components.supportChannel.boundary.supportersCopy}
          </Text>
        </View>

        {authBlocked ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.signInRequired.title}
            </Text>
            <Text style={styles.cardCopy}>
              {flareContent.components.supportChannel.signInRequired.copy}
            </Text>
          </View>
        ) : null}

        {visible && !authBlocked ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.steps.connect.title}
            </Text>
            <Text style={styles.cardCopy}>
              {channel?.configured
                ? flareContent.components.supportChannel.steps.connect.reconnectCopy
                : flareContent.components.supportChannel.steps.connect.copy}
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={
                  isConnecting ||
                  isCompletingConnection ||
                  isSaving ||
                  isLoading
                }
                onPress={() => void startConnect(channel?.configured === true)}
                style={[
                  styles.primaryButton,
                  (isConnecting ||
                    isCompletingConnection ||
                    isSaving ||
                    isLoading) &&
                    styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonLabel}>
                  {isConnecting || isCompletingConnection
                    ? flareContent.components.supportChannel.actions.connecting
                    : channel?.configured
                      ? flareContent.components.supportChannel.actions.reconnect
                      : flareContent.components.supportChannel.actions.connect}
                </Text>
              </Pressable>
              {channel?.configured && channel.enabled ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving || isSendingTest}
                  onPress={() => void disableCurrentChannel()}
                  style={[
                    styles.secondaryButton,
                    (isSaving || isSendingTest) && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.secondaryButtonLabel}>
                    {flareContent.components.supportChannel.actions.disable}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {showDestinationPicker ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.steps.choose.title}
            </Text>
            <Text style={styles.cardCopy}>
              {flareContent.components.supportChannel.steps.choose.copy}
            </Text>
            <View style={styles.optionList}>
              {destinations.map((destination) => {
                const isSelected = destination.id === selectedDestinationId;

                return (
                  <Pressable
                    key={destination.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedDestinationId(destination.id)}
                    style={[
                      styles.destinationCard,
                      isSelected && styles.destinationCardSelected,
                    ]}
                  >
                    <Text style={styles.destinationName}>{destination.name}</Text>
                    {destination.description ? (
                      <Text style={styles.destinationMeta}>
                        {destination.description}
                      </Text>
                    ) : null}
                    {destination.group_type ? (
                      <Text style={styles.destinationMeta}>
                        {destination.group_type}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {(showDestinationPicker || channel?.configured) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.steps.message.title}
            </Text>
            <Text style={styles.cardCopy}>
              {flareContent.components.supportChannel.steps.message.copy}
            </Text>
            <View style={styles.messagePreview}>
              <Text style={styles.messagePreviewLabel}>
                {flareContent.components.supportChannel.labels.savedMessage}
              </Text>
              <Text style={styles.messagePreviewText}>
                {channel?.message_preview ?? DEFAULT_SUPPORT_CHANNEL_MESSAGE}
              </Text>
            </View>
            {showDestinationPicker ? (
              <Pressable
                accessibilityRole="button"
                disabled={!selectedDestination || isSaving}
                onPress={() => void saveSelection()}
                style={[
                  styles.primaryButton,
                  (!selectedDestination || isSaving) && styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonLabel}>
                  {isSaving
                    ? flareContent.components.supportChannel.actions.saving
                    : flareContent.components.supportChannel.actions.save}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {channel?.configured ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {flareContent.components.supportChannel.steps.test.title}
            </Text>
            <Text style={styles.cardCopy}>
              {flareContent.components.supportChannel.steps.test.copy}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isSendingTest || isSaving}
              onPress={() => void sendTest()}
              style={[
                styles.primaryButton,
                (isSendingTest || isSaving) && styles.disabledButton,
              ]}
            >
              <Text style={styles.primaryButtonLabel}>
                {isSendingTest
                  ? flareContent.components.supportChannel.actions.sendingTest
                  : flareContent.components.supportChannel.actions.sendTest}
              </Text>
            </Pressable>
            {lastTestResult ? (
              <View style={styles.testResultCard}>
                <Text style={styles.detailLabel}>
                  {flareContent.components.supportChannel.labels.lastTest}
                </Text>
                <Text style={styles.detailValue}>{lastTestResult.status}</Text>
                {lastTestResult.error_message_safe ? (
                  <Text style={styles.destinationMeta}>
                    {lastTestResult.error_message_safe}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </View>
    </PlaceholderModal>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
    paddingBottom: 8,
  },
  heroCard: {
    ...flareTheme.shadows.card,
    gap: 10,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: flareTheme.colors.borderStrong,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  card: {
    ...flareTheme.shadows.card,
    gap: 10,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surface,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    color: flareTheme.colors.textStrong,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  cardCopy: {
    color: flareTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  helperCopy: {
    color: flareTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  detailList: {
    gap: 8,
  },
  detailRow: {
    gap: 4,
    padding: 12,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  detailLabel: {
    color: flareTheme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: {
    color: flareTheme.colors.textStrong,
    fontSize: 15,
    lineHeight: 21,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  readyBadge: {
    backgroundColor: flareTheme.colors.successBg,
    color: flareTheme.colors.successText,
  },
  pendingBadge: {
    backgroundColor: flareTheme.colors.neutralBg,
    color: flareTheme.colors.neutralText,
  },
  neutralBadge: {
    backgroundColor: flareTheme.colors.primaryMuted,
    color: flareTheme.colors.primaryStrong,
  },
  warningBadge: {
    backgroundColor: "#F7E6C9",
    color: "#805214",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    flexGrow: 1,
    minHeight: 48,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: flareTheme.colors.primary,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: flareTheme.colors.onPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    flexGrow: 1,
    minHeight: 48,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    color: flareTheme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  optionList: {
    gap: 10,
  },
  destinationCard: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: flareTheme.colors.border,
    backgroundColor: flareTheme.colors.surfaceStrong,
  },
  destinationCardSelected: {
    borderColor: flareTheme.colors.primaryBright,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  destinationName: {
    color: flareTheme.colors.textStrong,
    fontSize: 16,
    fontWeight: "700",
  },
  destinationMeta: {
    color: flareTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  messagePreview: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  messagePreviewLabel: {
    color: flareTheme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  messagePreviewText: {
    color: flareTheme.colors.textStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  testResultCard: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: flareTheme.colors.surfaceSoft,
  },
  notice: {
    color: flareTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: flareTheme.colors.dangerText,
    fontSize: 14,
    lineHeight: 20,
  },
});
