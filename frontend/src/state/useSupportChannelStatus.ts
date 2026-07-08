import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  getSupportChannel,
  hasUsableSupportChannel,
  type SupportChannel,
} from "../services/supportChannelApi";
import { useFlareAuth } from "./FlareAuthContext";

export function useSupportChannelStatus() {
  const { authState, authStatus } = useFlareAuth();
  const [supportChannel, setSupportChannel] = useState<SupportChannel | null>(
    null,
  );
  const [isSupportChannelLoading, setIsSupportChannelLoading] = useState(false);

  const replaceSupportChannelStatus = useCallback(
    (nextChannel: SupportChannel | null) => {
      setSupportChannel((currentValue) =>
        currentValue === nextChannel ? currentValue : nextChannel,
      );
      setIsSupportChannelLoading((currentValue) =>
        currentValue ? false : currentValue,
      );
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (authStatus !== "ready") {
        setIsSupportChannelLoading(true);

        return () => {
          isActive = false;
        };
      }

      if (authState.kind !== "authenticated") {
        replaceSupportChannelStatus(null);

        return () => {
          isActive = false;
        };
      }

      setIsSupportChannelLoading(true);

      void getSupportChannel()
        .then((nextChannel) => {
          if (!isActive) {
            return;
          }

          replaceSupportChannelStatus(nextChannel);
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          replaceSupportChannelStatus(null);
        });

      return () => {
        isActive = false;
      };
    }, [authState, authStatus, replaceSupportChannelStatus]),
  );

  return {
    isSupportChannelConfigured: hasUsableSupportChannel(supportChannel),
    isSupportChannelLoading,
    replaceSupportChannelStatus,
    supportChannel,
  };
}
