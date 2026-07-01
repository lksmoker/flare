import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { FlareAuthProvider, useFlareAuth } from "../FlareAuthContext";

function AuthHarness() {
  const { authState, authStatus, sendMagicLink, signInWithPassword, signOut } =
    useFlareAuth();

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
          void signOut();
        }}
      >
        <Text>sign out</Text>
      </Pressable>
    </View>
  );
}

describe("FlareAuthProvider", () => {
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
