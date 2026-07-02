import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PropsWithChildren, ReactNode } from "react";

import { CustomizeScreen } from "../CustomizeScreen";
import { FlareScreen } from "../FlareScreen";
import { HistoryScreen } from "../HistoryScreen";
import { AnchorNoteProvider } from "../../state/AnchorNoteContext";
import { BehaviorPatternProvider } from "../../state/BehaviorPatternContext";
import { FlareAuthProvider } from "../../state/FlareAuthContext";
import { FlareEventProvider } from "../../state/FlareEventContext";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

function TestProviders({ children }: PropsWithChildren) {
  return (
    <FlareAuthProvider
      initialAuthState={{ kind: "no-session" }}
      resolveAuthState={async () => ({ kind: "no-session" })}
      subscribe={() => null}
    >
      <BehaviorPatternProvider>
        <AnchorNoteProvider>
          <FlareEventProvider>{children}</FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>
    </FlareAuthProvider>
  );
}

describe("V0 app shell", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the top-level navigation labels and dominant Send Flare action", () => {
    const { getAllByText, getByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    expect(getAllByText("Flare").length).toBeGreaterThanOrEqual(1);
    expect(getByText("History")).toBeTruthy();
    expect(getByText("Customize")).toBeTruthy();
    expect(getByText("Send Flare")).toBeTruthy();
  });

  it("renders the flare screen hierarchy with actions before readiness cards", () => {
    const { toJSON } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });
    const rendered = JSON.stringify(toJSON());

    const sendFlareIndex = rendered.indexOf("Send Flare");
    const checkpointIndex = rendered.indexOf("Checkpoint / Reflection");
    const readinessIndex = rendered.indexOf("Readiness");

    expect(sendFlareIndex).toBeGreaterThan(-1);
    expect(checkpointIndex).toBeGreaterThan(sendFlareIndex);
    expect(readinessIndex).toBeGreaterThan(checkpointIndex);
  });

  it("shows Flare Response immediately when Send Flare is pressed", () => {
    const { getByText, queryByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    expect(queryByText("Flare Response")).toBeNull();

    fireEvent.press(getByText("Send Flare"));

    expect(getByText("Flare Response")).toBeTruthy();
    expect(getByText("Current Flare Event")).toBeTruthy();
    expect(getByText(/status: active/i)).toBeTruthy();
    expect(getByText("You paused the pattern")).toBeTruthy();
    expect(queryByText("Are you sure?")).toBeNull();
  });

  it("opens the Checkpoint / Reflection sheet and shows guidance when no active event exists", () => {
    const { getAllByText, getByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    fireEvent.press(getAllByText("Checkpoint / Reflection")[0]);

    expect(getByText("No active Flare Event")).toBeTruthy();
    expect(getByText("Save Reflection")).toBeTruthy();
  });

  it("renders the History empty state before any flare events exist", () => {
    const { getByText } = render(<HistoryScreen />, {
      wrapper: TestProviders,
    });

    expect(getByText("No Flare Events yet")).toBeTruthy();
  });

  it("keeps setup ownership inside Customize and marks Telegram as future-scoped", () => {
    const { getByText } = render(<CustomizeScreen />, {
      wrapper: TestProviders,
    });

    expect(getByText("Save your setup")).toBeTruthy();
    expect(getByText("Local-only")).toBeTruthy();
    expect(getByText("Behavior Pattern")).toBeTruthy();
    expect(getByText("Anchor Note")).toBeTruthy();
    expect(getByText("Telegram Support")).toBeTruthy();
    expect(getByText("Coming in V1")).toBeTruthy();
  });

  it("opens Behavior Pattern Setup from Customize and keeps Telegram future-scoped", () => {
    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper: TestProviders,
    });

    fireEvent.press(getAllByText("Behavior Pattern")[0]);
    expect(
      getByText(
        "Describe the pattern you want Flare to help you pause and reflect on.",
      ),
    ).toBeTruthy();
    expect(getByText("Save Behavior Pattern")).toBeTruthy();

    fireEvent.press(getByText("Close"));
    fireEvent.press(getAllByText("Anchor Note")[0]);
    expect(
      getByText(
        "Keep this honest, specific, and easy to revisit. This note is for self-support.",
      ),
    ).toBeTruthy();
    expect(getByText("Save Anchor Note")).toBeTruthy();
    expect(getByText("Telegram Support")).toBeTruthy();
    expect(getByText("Coming in V1")).toBeTruthy();
  });

  it("saves Anchor Note and shows the summary on Customize", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Anchor Note")[0]);

    fireEvent.changeText(
      getByLabelText("Why pause this pattern?"),
      "I want to stop before I lose the rest of tonight.",
    );
    fireEvent.changeText(
      getByLabelText("Costs of continuing"),
      "I will be numb tomorrow and break trust with myself.",
    );
    fireEvent.changeText(
      getByLabelText("Reminder from grounded self"),
      "The urge peaks fast and passes if I move.",
    );
    fireEvent.changeText(
      getByLabelText("Immediate next step"),
      "Put the phone away, drink water, and go outside.",
    );
    fireEvent.changeText(
      getByLabelText("Supportive phrase"),
      "Pause now. Protect tomorrow.",
    );

    fireEvent.press(getByText("Save Anchor Note"));

    expect(queryByText("Save Anchor Note")).toBeNull();
    expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Pause now. Protect tomorrow.")).toBeTruthy();
    expect(
      getByText("I want to stop before I lose the rest of tonight."),
    ).toBeTruthy();
    expect(
      getByText("Put the phone away, drink water, and go outside."),
    ).toBeTruthy();
  });

  it("saves a behavior pattern and shows the summary on Customize", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Behavior Pattern")[0]);

    fireEvent.changeText(
      getByLabelText("Behavior name"),
      "Evening doomscrolling",
    );
    fireEvent.changeText(
      getByLabelText("Short description"),
      "I keep opening social apps when I feel numb.",
    );
    fireEvent.changeText(
      getByLabelText("Common triggers"),
      "Stress after work",
    );
    fireEvent.changeText(
      getByLabelText("Risk times or situations"),
      "Late nights",
    );
    fireEvent.changeText(
      getByLabelText("Preferred next steps"),
      "Put the phone in another room and walk outside",
    );

    fireEvent.press(getByText("Save Behavior Pattern"));

    expect(queryByText("Save Behavior Pattern")).toBeNull();
    expect(getByText("Configured")).toBeTruthy();
    expect(getByText("Evening doomscrolling")).toBeTruthy();
    expect(getByText("Stress after work")).toBeTruthy();
    expect(
      getByText("Put the phone in another room and walk outside"),
    ).toBeTruthy();
  });

  it("updates the Flare readiness indicator after a behavior pattern is saved", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    expect(getByText("Local-only until sign in")).toBeTruthy();
    expect(getAllByText("Ready to set up").length).toBeGreaterThanOrEqual(2);

    fireEvent.press(getAllByText("Behavior Pattern")[0]);
    fireEvent.changeText(getByLabelText("Behavior name"), "Weekend drinking");
    fireEvent.changeText(
      getByLabelText("Preferred next steps"),
      "Leave the bar and call my brother",
    );
    fireEvent.press(getByText("Save Behavior Pattern"));

    expect(getByText("Configured: Weekend drinking")).toBeTruthy();
    expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
  });

  it("updates the Flare readiness indicator after Anchor Note is saved", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    expect(getAllByText("Ready to set up").length).toBeGreaterThanOrEqual(2);

    fireEvent.press(getAllByText("Anchor Note")[0]);
    fireEvent.changeText(
      getByLabelText("Why pause this pattern?"),
      "This urge is not worth the fallout.",
    );
    fireEvent.changeText(
      getByLabelText("Supportive phrase"),
      "Hold the line for ten minutes.",
    );
    fireEvent.press(getByText("Save Anchor Note"));

    expect(getByText("Configured: Hold the line for ten minutes.")).toBeTruthy();
  });

  it("shows saved Anchor Note immediately in Flare Response after Send Flare", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Anchor Note")[0]);
    fireEvent.changeText(
      getByLabelText("Why pause this pattern?"),
      "I want tomorrow morning back.",
    );
    fireEvent.changeText(
      getByLabelText("Reminder from grounded self"),
      "You do not need to obey this feeling.",
    );
    fireEvent.changeText(
      getByLabelText("Immediate next step"),
      "Leave the room and drink water.",
    );
    fireEvent.changeText(
      getByLabelText("Supportive phrase"),
      "Pause now. You already chose differently.",
    );
    fireEvent.press(getByText("Save Anchor Note"));

    fireEvent.press(getByText("Send Flare"));

    expect(getByText("Flare Response")).toBeTruthy();
    expect(getByText("Current Flare Event")).toBeTruthy();
    expect(
      getAllByText("Pause now. You already chose differently.").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      getAllByText("I want tomorrow morning back.").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      getAllByText("You do not need to obey this feeling.").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      getAllByText("Leave the room and drink water.").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("creates a flare event tied to the current behavior pattern and shows it in History", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      <>
        <CustomizeScreen />
        <FlareScreen />
        <HistoryScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Behavior Pattern")[0]);
    fireEvent.changeText(getByLabelText("Behavior name"), "Late-night scrolling");
    fireEvent.changeText(
      getByLabelText("Short description"),
      "I start checking feeds when I feel depleted.",
    );
    fireEvent.changeText(
      getByLabelText("Preferred next steps"),
      "Leave the room and put the phone away",
    );
    fireEvent.press(getByText("Save Behavior Pattern"));

    fireEvent.press(getByText("Send Flare"));

    expect(getAllByText("Flare Event").length).toBeGreaterThanOrEqual(1);
    expect(
      getAllByText(/Behavior Pattern: Late-night scrolling/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      getAllByText("I start checking feeds when I feel depleted.").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("saves a checkpoint reflection for the active event and shows it in History", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <>
        <FlareScreen />
        <HistoryScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getByText("Send Flare"));
    fireEvent.press(getAllByText("Checkpoint / Reflection")[1]);

    fireEvent.changeText(
      getByLabelText("What happened?"),
      "I felt the spike right after finishing work.",
    );
    fireEvent.changeText(
      getByLabelText("What helped?"),
      "I left the room and drank cold water.",
    );
    fireEvent.changeText(
      getByLabelText("How do I feel now?"),
      "Less flooded and more steady.",
    );
    fireEvent.press(getByText("Avoided"));
    fireEvent.changeText(
      getByLabelText("Optional note"),
      "The first minute was the hardest part.",
    );
    fireEvent.press(getByText("Save Reflection"));

    expect(queryByText("Save Reflection")).toBeNull();
    expect(getByText("Reflection saved for this event")).toBeTruthy();
    expect(
      getByText(/What happened: I felt the spike right after finishing work\./),
    ).toBeTruthy();
    expect(
      getByText(/What helped: I left the room and drank cold water\./),
    ).toBeTruthy();
    expect(
      getByText(/How I feel now: Less flooded and more steady\./),
    ).toBeTruthy();
    expect(getByText(/Outcome:/i)).toBeTruthy();
    expect(
      getByText(/Note: The first minute was the hardest part\./),
    ).toBeTruthy();
    expect(getByText(/Reflected event/i)).toBeTruthy();
  });

  it("keeps Telegram support future-scoped after the flare event flow changes", () => {
    const { getAllByText, getByText } = render(
      <>
        <FlareScreen />
        <CustomizeScreen />
        <HistoryScreen />
      </>,
      {
        wrapper: TestProviders,
      },
    );

    expect(getAllByText("Telegram Support").length).toBeGreaterThanOrEqual(2);
    expect(getAllByText("Coming in V1").length).toBeGreaterThanOrEqual(1);
    expect(
      getByText(
        /Future direction only\. V0 does not send messages, alerts, or outreach on your behalf\./,
      ),
    ).toBeTruthy();
  });

  it("settles without a maximum update depth error while auth initializes", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { getByText } = render(<FlareScreen />, {
      wrapper({ children }) {
        return (
          <FlareAuthProvider
            resolveAuthState={async () => ({ kind: "no-session" })}
            subscribe={() => null}
          >
            <BehaviorPatternProvider>
              <AnchorNoteProvider>
                <FlareEventProvider>{children}</FlareEventProvider>
              </AnchorNoteProvider>
            </BehaviorPatternProvider>
          </FlareAuthProvider>
        );
      },
    });

    await waitFor(() => {
      expect(getByText("Local-only until sign in")).toBeTruthy();
    });

    expect(
      consoleError.mock.calls.some((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Maximum update depth exceeded"),
        ),
      ),
    ).toBe(false);
  });
});
