import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AuthStatusCard } from "../AuthStatusCard";
import { FlareAuthProvider } from "../../state/FlareAuthContext";

describe("AuthStatusCard", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL;
  });

  it("keeps sign-in available by default", async () => {
    const signInWithPasswordRequest = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByLabelText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        signInWithPasswordRequest={signInWithPasswordRequest}
        subscribe={() => null}
      >
        <AuthStatusCard />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(getByText("Existing account")).toBeTruthy();
    });

    fireEvent.changeText(getByLabelText("Email address"), "flare@example.com");
    fireEvent.changeText(getByLabelText("Password"), "password-123");
    fireEvent.press(getByText("Sign in"));

    await waitFor(() => {
      expect(signInWithPasswordRequest).toHaveBeenCalledWith(
        "flare@example.com",
        "password-123",
      );
    });
  });

  it("uses the create-account path when selected", async () => {
    const signUpRequest = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByLabelText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        signUpRequest={signUpRequest}
        subscribe={() => null}
      >
        <AuthStatusCard />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(getByText("First-time setup")).toBeTruthy();
    });

    fireEvent.press(getByText("First-time setup"));
    fireEvent.changeText(getByLabelText("Email address"), "flare@example.com");
    fireEvent.changeText(getByLabelText("Password"), "password-123");
    fireEvent.press(getByText("Create account"));

    await waitFor(() => {
      expect(signUpRequest).toHaveBeenCalledWith(
        "flare@example.com",
        "password-123",
      );
    });
  });

  it("shows the configured redirect URL for magic-link guidance", async () => {
    process.env.EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL = "http://100.64.0.10:8081";

    const { getByText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        subscribe={() => null}
      >
        <AuthStatusCard />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(
        getByText("Sign-in return URL: http://100.64.0.10:8081"),
      ).toBeTruthy();
    });
  });

  it("shows a predictable fallback message when the redirect URL is missing", async () => {
    const sendMagicLinkRequest = jest.fn().mockResolvedValue(undefined);

    const { getByText, getByLabelText } = render(
      <FlareAuthProvider
        resolveAuthState={async () => ({ kind: "no-session" })}
        sendMagicLinkRequest={sendMagicLinkRequest}
        subscribe={() => null}
      >
        <AuthStatusCard />
      </FlareAuthProvider>,
    );

    await waitFor(() => {
      expect(getByText("Existing account")).toBeTruthy();
    });

    fireEvent.changeText(getByLabelText("Email address"), "flare@example.com");
    fireEvent.press(getByText("Send magic link"));

    await waitFor(() => {
      expect(sendMagicLinkRequest).toHaveBeenCalledWith("flare@example.com");
      expect(
        getByText(
          "Magic link sent. The sign-in link will use the configured return URL.",
        ),
      ).toBeTruthy();
    });
  });

  it("renders signed-in state collapsed by default and toggles details", async () => {
    const signOutRequest = jest.fn().mockResolvedValue(undefined);

    const { getByLabelText, getByText, queryByText } = render(
      <FlareAuthProvider
        initialAuthState={{
          kind: "authenticated",
          userEmail: "luke.smoker@gmail.com",
          userId: "user-123",
        }}
        signOutRequest={signOutRequest}
        subscribe={() => null}
      >
        <AuthStatusCard />
      </FlareAuthProvider>,
    );

    const disclosureButton = getByLabelText("Show saved setup details");

    expect(getByText("Save your setup")).toBeTruthy();
    expect(getByText("Connected")).toBeTruthy();
    expect(getByText("Signed in as luke.smoker@gmail.com")).toBeTruthy();
    expect(disclosureButton.props.accessibilityState).toEqual({
      expanded: false,
    });
    expect(
      queryByText(
        "Your Behavior Pattern and Anchor Note can now reload when you sign in on this device.",
      ),
    ).toBeNull();
    expect(queryByText("Sign out")).toBeNull();

    fireEvent.press(disclosureButton);

    expect(getByLabelText("Hide saved setup details").props.accessibilityState).toEqual(
      {
        expanded: true,
      },
    );
    expect(
      getByText(
        "Your Behavior Pattern and Anchor Note can now reload when you sign in on this device.",
      ),
    ).toBeTruthy();
    expect(
      getByText(
        "Flare is a self-support tool. It does not monitor you in real time or contact anyone for you.",
      ),
    ).toBeTruthy();
    fireEvent.press(getByText("Sign out"));

    await waitFor(() => {
      expect(signOutRequest).toHaveBeenCalled();
    });
  });
});


