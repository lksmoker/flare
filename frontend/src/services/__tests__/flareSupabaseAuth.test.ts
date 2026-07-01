import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  resolveFlareSupabaseAuthState,
  sendFlareSupabaseMagicLink,
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
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
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

describe("flareSupabaseAuth", () => {
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

    await sendFlareSupabaseMagicLink(" flare@example.com ", client as never);

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "flare@example.com",
    });
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
