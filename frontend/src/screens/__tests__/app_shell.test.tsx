import { fireEvent, render } from "@testing-library/react-native";
import { PropsWithChildren, ReactNode } from "react";

import { CustomizeScreen } from "../CustomizeScreen";
import { FlareScreen } from "../FlareScreen";
import { HistoryScreen } from "../HistoryScreen";
import { BehaviorPatternProvider } from "../../state/BehaviorPatternContext";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

function TestProviders({ children }: PropsWithChildren) {
  return <BehaviorPatternProvider>{children}</BehaviorPatternProvider>;
}

describe("V0 app shell", () => {
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

  it("shows Recovery Response immediately when Send Flare is pressed", () => {
    const { getByText, queryByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    expect(queryByText("Recovery Response")).toBeNull();

    fireEvent.press(getByText("Send Flare"));

    expect(getByText("Recovery Response")).toBeTruthy();
    expect(getByText("You already interrupted the spiral.")).toBeTruthy();
    expect(queryByText("Are you sure?")).toBeNull();
  });

  it("opens the Checkpoint / Reflection placeholder sheet", () => {
    const { getAllByText, getByText } = render(<FlareScreen />, {
      wrapper: TestProviders,
    });

    fireEvent.press(getAllByText("Checkpoint / Reflection")[0]);

    expect(getByText("A quick placeholder sheet for the post-flare reflection flow.")).toBeTruthy();
  });

  it("renders the History placeholder list", () => {
    const { getAllByText } = render(<HistoryScreen />, {
      wrapper: TestProviders,
    });

    expect(getAllByText("Flare Event")).toHaveLength(2);
    expect(getAllByText("Checkpoint / Reflection")).toHaveLength(1);
  });

  it("keeps setup ownership inside Customize and marks Telegram as future-scoped", () => {
    const { getByText } = render(<CustomizeScreen />, {
      wrapper: TestProviders,
    });

    expect(getByText("Behavior Pattern Setup")).toBeTruthy();
    expect(getByText("Recovery Memory Setup")).toBeTruthy();
    expect(getByText("Telegram Support")).toBeTruthy();
    expect(getByText("Coming in V1")).toBeTruthy();
  });

  it("opens Behavior Pattern Setup from Customize and keeps Recovery Memory and Telegram unchanged", () => {
    const { getAllByText, getByText } = render(<CustomizeScreen />, {
      wrapper: TestProviders,
    });

    fireEvent.press(getAllByText("Behavior Pattern Setup")[0]);
    expect(
      getByText(
        "Capture the pattern you want Flare to help interrupt. This stays local and editable in V0.",
      ),
    ).toBeTruthy();
    expect(getByText("Save Behavior Pattern")).toBeTruthy();

    fireEvent.press(getByText("Close"));
    fireEvent.press(getAllByText("Recovery Memory Setup")[0]);
    expect(getByText("A V0 ownership placeholder for Recovery Memory editing.")).toBeTruthy();
    expect(getByText("Telegram Support")).toBeTruthy();
    expect(getByText("Coming in V1")).toBeTruthy();
  });

  it("saves a behavior pattern and shows the summary on Customize", () => {
    const { getAllByText, getByLabelText, getByText, queryByText } = render(
      <CustomizeScreen />,
      {
        wrapper: TestProviders,
      },
    );

    fireEvent.press(getAllByText("Behavior Pattern Setup")[0]);

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
      getByLabelText("Preferred recovery actions"),
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

    expect(getAllByText("Ready to define").length).toBeGreaterThanOrEqual(2);

    fireEvent.press(getAllByText("Behavior Pattern Setup")[0]);
    fireEvent.changeText(getByLabelText("Behavior name"), "Weekend drinking");
    fireEvent.changeText(
      getByLabelText("Preferred recovery actions"),
      "Leave the bar and call my brother",
    );
    fireEvent.press(getByText("Save Behavior Pattern"));

    expect(getByText("Configured: Weekend drinking")).toBeTruthy();
    expect(getAllByText("Configured").length).toBeGreaterThanOrEqual(1);
  });
});
