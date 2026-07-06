import {
  clearSupportChannelCallbackParams,
  completeGroupMeConnect,
  configureSupportChannel,
  DEFAULT_SUPPORT_CHANNEL_MESSAGE,
  getSupportChannel,
  readAccessTokenFromCurrentUrl,
  readAccessTokenFromUrl,
  sendSupportChannelFlare,
  sendSupportChannelTest,
  SupportChannelApiError,
} from "../supportChannelApi";

function createJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as never;
}

const originalWindow = globalThis.window;

function installMockWindow(url: string) {
  const parsedUrl = new URL(url, "http://localhost");
  const mockWindow = {
    location: {
      hash: parsedUrl.hash,
      href: parsedUrl.href,
      origin: parsedUrl.origin,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
    },
    history: {
      state: null as unknown,
      replaceState(state: unknown, _unused: string, nextUrl: string) {
        this.state = state;
        const resolvedUrl = new URL(nextUrl, "http://localhost");

        mockWindow.location.href = resolvedUrl.href;
        mockWindow.location.pathname = resolvedUrl.pathname;
        mockWindow.location.search = resolvedUrl.search;
        mockWindow.location.hash = resolvedUrl.hash;
      },
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: mockWindow,
    writable: true,
  });
}

describe("supportChannelApi", () => {
  beforeEach(() => {
    installMockWindow("/customize");
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
      writable: true,
    });
  });

  it("reads the support channel from the authenticated backend route", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        channel: {
          configured: true,
          destination_display_name: "Close Friends",
          enabled: true,
          last_delivery_at: "2026-07-06T03:10:00Z",
          last_delivery_status: "sent",
          message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
          provider: "groupme",
          status: "connected",
        },
      }),
    );

    await expect(
      getSupportChannel({
        fetchImpl,
        getAccessToken: async () => "token-123",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        destination_display_name: "Close Friends",
        provider: "groupme",
      }),
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost/api/support-channel",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer token-123",
        }),
        method: "GET",
      }),
    );
  });

  it("posts the safe configure payload without exposing provider internals", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        channel: {
          configured: true,
          destination_display_name: "Group One",
          enabled: true,
          last_delivery_at: null,
          last_delivery_status: null,
          message_preview: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
          provider: "groupme",
          status: "connected",
        },
      }),
    );

    await configureSupportChannel(
      {
        connectSessionId: "session-123",
        externalGroupId: "group-1",
      },
      {
        fetchImpl,
        getAccessToken: async () => "token-123",
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost/api/support-channel/configure",
      expect.objectContaining({
        body: expect.any(String),
      }),
    );
    expect(
      JSON.parse(fetchImpl.mock.calls[0][1].body as string),
    ).toEqual({
      connect_session_id: "session-123",
      default_message: DEFAULT_SUPPORT_CHANNEL_MESSAGE,
      enabled: true,
      external_group_id: "group-1",
    });
  });

  it("uses the configured API base URL for Tailscale-accessible backend requests", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        channel: null,
      }),
    );

    await getSupportChannel({
      env: {
        EXPO_PUBLIC_FLARE_API_BASE_URL: "https://flare-api.tailnet.ts.net:9001/",
      },
      fetchImpl,
      getAccessToken: async () => "token-123",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://flare-api.tailnet.ts.net:9001/api/support-channel",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("surfaces safe backend errors from test sends", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            code: "support_channel_not_found",
            message: "Support channel could not be found for this user.",
          },
        },
        404,
      ),
    );

    await expect(
      sendSupportChannelTest({
        fetchImpl,
        getAccessToken: async () => "token-123",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SupportChannelApiError>>({
        code: "support_channel_not_found",
        message: "Support channel could not be found for this user.",
        statusCode: 404,
      }),
    );
  });

  it("returns safe blocked flare-delivery results without throwing", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse(
        {
          result: {
            attempted_at: "2026-07-06T03:40:00Z",
            delivered_at: null,
            destination_display_name: null,
            error_code: "support_channel_not_configured",
            error_message_safe: "No support group is configured for this account.",
            message_preview: "",
            provider: "groupme",
            send_kind: "real",
            status: "blocked",
          },
        },
        409,
      ),
    );

    await expect(
      sendSupportChannelFlare(
        { flareEventId: "event-1" },
        {
          fetchImpl,
          getAccessToken: async () => "token-123",
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        error_code: "support_channel_not_configured",
        send_kind: "real",
        status: "blocked",
      }),
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost/api/support-channel/send-flare",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body as string)).toEqual({
      flare_event_id: "event-1",
    });
  });

  it("builds the callback request from an access token", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createJsonResponse({
        connection: {
          connect_session_id: "session-123",
          provider: "groupme",
          status: "authorized",
        },
      }),
    );

    await completeGroupMeConnect("access-123", {
      fetchImpl,
      getAccessToken: async () => "token-123",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost/api/support-channel/groupme/connect/callback?access_token=access-123",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("reads support callback access tokens from either query or hash values", () => {
    expect(
      readAccessTokenFromUrl(
        "flare://customize?access_token=query-token&token_type=bearer",
      ),
    ).toBe("query-token");
    expect(
      readAccessTokenFromUrl(
        "http://localhost/customize#access_token=hash-token&token_type=bearer",
      ),
    ).toBe("hash-token");
  });

  it("clears callback tokens from the current browser URL after they are used", () => {
    installMockWindow(
      "/customize?access_token=query-token#access_token=hash-token&token_type=bearer",
    );

    expect(readAccessTokenFromCurrentUrl()).toBe("query-token");

    clearSupportChannelCallbackParams();

    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("");
  });
});
