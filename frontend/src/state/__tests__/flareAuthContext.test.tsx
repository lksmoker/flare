import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import * as flareSupabaseAuth from "../../services/flareSupabaseAuth";
import { FlareAuthProvider, useFlareAuth } from "../FlareAuthContext";

function AuthHarness() {
  const {
    authState,
    authStatus,
    sendMagicLink,
    signInWithPassword,
    signOut,
    signUp,
  } = useFlareAuth();

  return (
    <View>
      <Text>auth status: {authStatus}</Text>
      <Text>auth kind: {authState.kind}</Text>
      <Text>
        auth user: {authState.kind === "authenticated" ? authState.userId : "none"}
      </Text>
      <Pressable
        onPress={() => {
          void signInWithPassword("flare@example.com", "password-123");
        }}
      >
        <Text>password sign in</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void sendMagicLink("flare@example.com");
        }}
      >
        <Text>magic link sign in</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void signUp("flare@example.com", "password-123");
        }}
      >
        <Text>create account</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void signOut();
        }}
      >
        <Text>sign out</Text>
      </Pressable>
    </View>
  );
}

describe("FlareAuthProvider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles the no-session case during initialization", async () => {
    const { getByText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        subscribe={() => null}
      >
        <AuthHarness />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(getByText("auth status: ready")).toBeTruthy();
      expect(getByText("auth kind: no-session")).toBeTruthy();
    });
  });

  it("initializes and subscribes once with the default runtime helpers", async () => {
    const resolveAuthState = jest
      .spyOn(flareSupabaseAuth, "resolveFlareSupabaseAuthState")
      .mockResolvedValue({ kind: "no-session" });
    const unsubscribe = jest.fn();
    let authChangeHandler:
      | Parameters<typeof flareSupabaseAuth.subscribeToFlareSupabaseAuthState>[0]
      | null = null;
    const subscribe = jest
      .spyOn(flareSupabaseAuth, "subscribeToFlareSupabaseAuthState")
      .mockImplementation((onChange) => {
        authChangeHandler = onChange;
        return { unsubscribe };
      });

    const { getByText, unmount } = render(
      <FlareAuthProvider>
        <AuthHarness />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(getByText("auth status: ready")).toBeTruthy();
    });

    expect(resolveAuthState).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(authChangeHandler).not.toBeNull();

    await act(async () => {
      authChangeHandler?.({
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      } as flareSupabaseAuth.FlareSupabaseAuthState, "SIGNED_IN", null);
    });

    await waitFor(() => {
      expect(getByText("auth kind: authenticated")).toBeTruthy();
      expect(getByText("auth user: user-123")).toBeTruthy();
    });

    expect(resolveAuthState).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("calls the password sign-in request", async () => {
    const signInWithPasswordRequest = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        signInWithPasswordRequest={signInWithPasswordRequest}
        subscribe={() => null}
      >
        <AuthHarness />
      </FlareAuthProvider>,
    );

    fireEvent.press(getByText("password sign in"));

    await waitFor(() => {
      expect(signInWithPasswordRequest).toHaveBeenCalledWith(
        "flare@example.com",
        "password-123",
      );
    });
  });

  it("calls the sign-up request", async () => {
    const signUpRequest = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        signUpRequest={signUpRequest}
        subscribe={() => null}
      >
        <AuthHarness />
      </FlareAuthProvider>,
    );

    fireEvent.press(getByText("create account"));

    await waitFor(() => {
      expect(signUpRequest).toHaveBeenCalledWith(
        "flare@example.com",
        "password-123",
      );
    });
  });

  it("clears the authenticated session state after sign-out", async () => {
    const signOutRequest = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({
          kind: "authenticated",
          userEmail: "flare@example.com",
          userId: "user-123",
        })}
        signOutRequest={signOutRequest}
        subscribe={() => null}
      >
        <AuthHarness />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(getByText("auth kind: authenticated")).toBeTruthy();
      expect(getByText("auth user: user-123")).toBeTruthy();
    });

    fireEvent.press(getByText("sign out"));

    await waitFor(() => {
      expect(signOutRequest).toHaveBeenCalled();
      expect(getByText("auth kind: no-session")).toBeTruthy();
      expect(getByText("auth user: none")).toBeTruthy();
    });
  });
});
