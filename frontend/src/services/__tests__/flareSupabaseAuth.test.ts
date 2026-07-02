import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  hydrateFlareSupabaseSessionFromUrl,
  PUBLIC_AUTH_REDIRECT_URL_ENV_NAME,
  readFlareAuthRedirectUrl,
  resolveFlareSupabaseAuthState,
  sendFlareSupabaseMagicLink,
  signUpForFlareSupabase,
  signInToFlareSupabaseWithPassword,
  signOutFromFlareSupabase,
  subscribeToFlareSupabaseAuthState,
} from "../flareSupabaseAuth";

function createClientStub(overrides?: Partial<Record<string, unknown>>) {
  const subscription = {
    unsubscribe: jest.fn(),
  };
  const onAuthStateChange = jest.fn(
    (
      callback: (
        event: AuthChangeEvent,
        session: Session | null,
      ) => void,
    ) => {
      createClientStub.lastAuthCallback = callback;

      return { data: { subscription } };
    },
  );
  const client = {
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange,
      exchangeCodeForSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      setSession: jest
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signUp: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      ...(overrides?.auth as object),
    },
  };

  return { client, subscription };
}

createClientStub.lastAuthCallback = null as ((
  event: AuthChangeEvent,
  session: Session | null,
) => void) | null;

const originalWindow = globalThis.window;

function installMockWindow(url: string) {
  const parsedUrl = new URL(url, "http://localhost");
  const mockWindow = {
    location: {
      hash: parsedUrl.hash,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
    },
    history: {
      state: null as unknown,
      replaceState(state: unknown, _unused: string, nextUrl: string) {
        this.state = state;
        const resolvedUrl = new URL(nextUrl, "http://localhost");

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

  return mockWindow;
}

describe("flareSupabaseAuth", () => {
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

  it("returns no-session when neither session nor user exists", async () => {
    const { client } = createClientStub();

    await expect(
      resolveFlareSupabaseAuthState(client as never),
    ).resolves.toEqual({
      kind: "no-session",
    });
  });

  it("returns the authenticated user from the active session", async () => {
    const { client } = createClientStub({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                email: "flare@example.com",
                id: "user-123",
              },
            },
          },
          error: null,
        }),
      },
    });

    await expect(
      resolveFlareSupabaseAuthState(client as never),
    ).resolves.toEqual({
      kind: "authenticated",
      userEmail: "flare@example.com",
      userId: "user-123",
    });
  });

  it("hydrates an authenticated session from web hash tokens and clears the hash", async () => {
    installMockWindow(
      "/customize#access_token=access-123&refresh_token=refresh-456&type=magiclink",
    );
    const { client } = createClientStub({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        setSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                email: "flare@example.com",
                id: "user-123",
              },
            },
          },
          error: null,
        }),
      },
    });

    await expect(
      resolveFlareSupabaseAuthState(client as never),
    ).resolves.toEqual({
      kind: "authenticated",
      userEmail: "flare@example.com",
      userId: "user-123",
    });

    expect(client.auth.setSession).toHaveBeenCalledWith({
      access_token: "access-123",
      refresh_token: "refresh-456",
    });
    expect(window.location.hash).toBe("");
  });

  it("hydrates an authenticated session from the PKCE code path and clears the query param", async () => {
    installMockWindow("/customize?code=pkce-123");
    const { client } = createClientStub({
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                email: "flare@example.com",
                id: "user-123",
              },
            },
          },
          error: null,
        }),
      },
    });

    await expect(
      hydrateFlareSupabaseSessionFromUrl(client as never),
    ).resolves.toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: "flare@example.com",
          id: "user-123",
        }),
      }),
    );

    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("pkce-123");
    expect(window.location.search).toBe("");
  });

  it("signs in with password through the Supabase auth client", async () => {
    const { client } = createClientStub();

    await signInToFlareSupabaseWithPassword(
      { email: " flare@example.com ", password: "password-123" },
      client as never,
    );

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "flare@example.com",
      password: "password-123",
    });
  });

  it("sends a magic link through the Supabase auth client", async () => {
    const { client } = createClientStub();

    await sendFlareSupabaseMagicLink(" flare@example.com ", client as never, {
      [PUBLIC_AUTH_REDIRECT_URL_ENV_NAME]: "http://100.64.0.10:8081",
    });

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "flare@example.com",
      options: {
        emailRedirectTo: "http://100.64.0.10:8081",
      },
    });
  });

  it("omits the magic-link redirect option when the public redirect env is missing", async () => {
    const { client } = createClientStub();

    await sendFlareSupabaseMagicLink(" flare@example.com ", client as never, {});

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "flare@example.com",
      options: undefined,
    });
  });

  it("signs up through the Supabase auth client with the configured redirect URL", async () => {
    const { client } = createClientStub();

    await signUpForFlareSupabase(
      { email: " flare@example.com ", password: "password-123" },
      client as never,
      {
        [PUBLIC_AUTH_REDIRECT_URL_ENV_NAME]: "http://100.64.0.10:8081",
      },
    );

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "flare@example.com",
      password: "password-123",
      options: {
        emailRedirectTo: "http://100.64.0.10:8081",
      },
    });
  });

  it("reads the public auth redirect env predictably", () => {
    expect(
      readFlareAuthRedirectUrl({
        [PUBLIC_AUTH_REDIRECT_URL_ENV_NAME]: " http://100.64.0.10:8081 ",
      }),
    ).toBe("http://100.64.0.10:8081");
    expect(readFlareAuthRedirectUrl({})).toBeNull();
  });

  it("signs out through the Supabase auth client", async () => {
    const { client } = createClientStub();

    await signOutFromFlareSupabase(client as never);

    expect(client.auth.signOut).toHaveBeenCalled();
  });

  it("subscribes to auth changes and maps the emitted session", () => {
    const { client, subscription } = createClientStub();
    const onChange = jest.fn();

    const activeSubscription = subscribeToFlareSupabaseAuthState(
      onChange,
      client as never,
    );

    createClientStub.lastAuthCallback?.("SIGNED_IN", {
      user: {
        email: "flare@example.com",
        id: "user-123",
      },
    } as Session);

    expect(onChange).toHaveBeenCalledWith(
      {
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      },
      "SIGNED_IN",
      expect.objectContaining({
        user: expect.objectContaining({
          id: "user-123",
        }),
      }),
    );

    activeSubscription?.unsubscribe();
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
