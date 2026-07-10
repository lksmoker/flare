import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PropsWithChildren, ReactNode } from "react";

import { CustomizeScreen } from "../CustomizeScreen";
import { WelcomeGateScreen } from "../WelcomeGateScreen";
import { AnchorNoteProvider } from "../../state/AnchorNoteContext";
import { BehaviorPatternProvider } from "../../state/BehaviorPatternContext";
import { FlareAuthProvider } from "../../state/FlareAuthContext";
import { FlareEventProvider } from "../../state/FlareEventContext";
import type { FlareEventRepository } from "../../services/flareEventRepository";
import { FLARE_WELCOME_COMPLETION_KEY } from "../../services/welcomeState";

const mockPush = jest.fn();

const mockFlarePlanState = {
  archiveAction: jest.fn(),
  canEditPlan: false,
  createCustomAction: jest.fn(),
  createFromTemplate: jest.fn(),
  ensureTemplatesLoaded: jest.fn(),
  errorBanner: null,
  isActionPending: () => false,
  isAtActionLimit: false,
  isInitialLoading: false,
  isPlanConfigured: true,
  isReorderPending: false,
  isRefreshing: false,
  isTemplatePending: () => false,
  isUsingBuiltInDefaultPlan: true,
  plan: {
    id: "built-in-default-flare-plan",
    is_configured: true,
    active_action_count: 4,
    maximum_active_actions: 10,
    actions: [],
    updated_at: "2026-07-08T00:00:00.000Z",
  },
  planError: null,
  refetchAll: jest.fn(),
  retryPlan: jest.fn(),
  retryTemplates: jest.fn(),
  saveAction: jest.fn(),
  templates: [],
  templatesError: null,
  updateLocalPlan: jest.fn(),
  reorderActions: jest.fn(),
};

jest.mock("../../state/FlarePlanContext", () => ({
  FlarePlanProvider: ({ children }: { children: ReactNode }) => children,
  useFlarePlan: () => mockFlarePlanState,
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const storage = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        storage.delete(key);
        return Promise.resolve();
      }),
      __reset() {
        storage.clear();
      },
      __setStoredValue(key: string, value: string) {
        storage.set(key, value);
      },
    },
  };
});

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");

  return {
    Link: ({ children }: { children: ReactNode }) => children,
    useLocalSearchParams() {
      return {};
    },
    useRouter() {
      return {
        push: mockPush,
      };
    },
    useFocusEffect(effect: () => void | (() => void)) {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

const emptyFlareEventRepository: FlareEventRepository = {
  archiveFlareEvent: jest.fn(),
  createFlareEvent: jest.fn(),
  loadFlareEvents: jest.fn().mockResolvedValue([]),
  restoreFlareEvent: jest.fn(),
  updateFlareEventStatus: jest.fn(),
};

const asyncStorage = jest.requireMock(
  "@react-native-async-storage/async-storage",
).default as {
  __reset: () => void;
  __setStoredValue: (key: string, value: string) => void;
  setItem: jest.Mock;
};

function SignedOutProviders({ children }: PropsWithChildren) {
  return (
    <FlareAuthProvider
      initialAuthState={{ kind: "no-session" }}
      subscribe={() => null}
    >
      <BehaviorPatternProvider>
        <AnchorNoteProvider>
          <FlareEventProvider flareEventRepository={emptyFlareEventRepository}>
            {children}
          </FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>
    </FlareAuthProvider>
  );
}

function SignedInProviders({ children }: PropsWithChildren) {
  return (
    <FlareAuthProvider
      initialAuthState={{
        kind: "authenticated",
        userEmail: "flare@example.com",
        userId: "user-123",
      }}
      subscribe={() => null}
    >
      <BehaviorPatternProvider>
        <AnchorNoteProvider>
          <FlareEventProvider flareEventRepository={emptyFlareEventRepository}>
            {children}
          </FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>
    </FlareAuthProvider>
  );
}

describe("WelcomeGateScreen", () => {
  afterEach(() => {
    asyncStorage.__reset();
    asyncStorage.setItem.mockClear();
    mockPush.mockReset();
  });

  it("shows Welcome on first use for a signed-out user", async () => {
    const { getByText, queryByText } = render(<WelcomeGateScreen />, {
      wrapper: SignedOutProviders,
    });

    await waitFor(() => {
      expect(getByText("Hold on to your support and your clarity")).toBeTruthy();
    });

    expect(
      getByText(
        "The people and encouragement you have chosen to keep close when you need them.",
      ),
    ).toBeTruthy();
    expect(getByText("Go to sign in")).toBeTruthy();
    expect(queryByText("Finish setting up Flare")).toBeNull();
  });

  it("completes Welcome with the primary action and shows the existing Flare screen", async () => {
    const { getByText, queryByText } = render(<WelcomeGateScreen />, {
      wrapper: SignedOutProviders,
    });

    await waitFor(() => {
      expect(getByText("Get started")).toBeTruthy();
    });

    fireEvent.press(getByText("Get started"));

    await waitFor(() => {
      expect(getByText("Send Flare")).toBeTruthy();
    });

    expect(queryByText("Hold on to your support and your clarity")).toBeNull();
    expect(asyncStorage.setItem).toHaveBeenCalledWith(
      FLARE_WELCOME_COMPLETION_KEY,
      "true",
    );
  });

  it("does not show Welcome again after local completion", async () => {
    asyncStorage.__setStoredValue(FLARE_WELCOME_COMPLETION_KEY, "true");

    const { getByText, queryByText } = render(<WelcomeGateScreen />, {
      wrapper: SignedOutProviders,
    });

    await waitFor(() => {
      expect(getByText("Send Flare")).toBeTruthy();
    });

    expect(queryByText("Hold on to your support and your clarity")).toBeNull();
  });

  it("routes signed-out users into the existing sign-in flow from Welcome", async () => {
    const { getByText } = render(<WelcomeGateScreen />, {
      wrapper: SignedOutProviders,
    });

    await waitFor(() => {
      expect(getByText("Go to sign in")).toBeTruthy();
    });

    fireEvent.press(getByText("Go to sign in"));

    expect(mockPush).toHaveBeenCalledWith("/customize?focus=auth");
  });

  it("skips Welcome for authenticated users and renders the existing Flare screen", async () => {
    const { getByText, queryByText } = render(<WelcomeGateScreen />, {
      wrapper: SignedInProviders,
    });

    await waitFor(() => {
      expect(getByText("Continue setup")).toBeTruthy();
    });

    expect(queryByText("Hold on to your support and your clarity")).toBeNull();
  });

  it("reopens Welcome from Customize and hides sign-in upsell copy for signed-in users", async () => {
    const { getByText, queryByText } = render(<CustomizeScreen />, {
      wrapper: SignedInProviders,
    });

    fireEvent.press(getByText("Welcome to Flare"));

    await waitFor(() => {
      expect(getByText("Hold on to your support and your clarity")).toBeTruthy();
    });

    expect(
      getByText(
        "You are already signed in, so your setup can be saved to your account, reloaded when you return, and used with account-based features like Support Group.",
      ),
    ).toBeTruthy();
    expect(queryByText("Go to sign in")).toBeNull();
  });
});
