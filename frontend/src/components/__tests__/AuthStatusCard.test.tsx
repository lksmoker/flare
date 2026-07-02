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

    fireEvent.changeText(getByLabelText("Auth email"), "flare@example.com");
    fireEvent.changeText(getByLabelText("Auth password"), "password-123");
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
    fireEvent.changeText(getByLabelText("Auth email"), "flare@example.com");
    fireEvent.changeText(getByLabelText("Auth password"), "password-123");
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
        getByText("Current redirect URL: http://100.64.0.10:8081"),
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

    fireEvent.changeText(getByLabelText("Auth email"), "flare@example.com");
    fireEvent.press(getByText("Send magic link"));

    await waitFor(() => {
      expect(sendMagicLinkRequest).toHaveBeenCalledWith("flare@example.com");
      expect(
        getByText(
          "Magic link sent if email auth is enabled. Without EXPO_PUBLIC_FLARE_AUTH_REDIRECT_URL, Supabase falls back to the project Site URL.",
        ),
      ).toBeTruthy();
    });
  });
});
