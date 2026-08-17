import { fireEvent, render } from "@testing-library/react-native";

import { BehaviorPatternSetupModal } from "../BehaviorPatternSetupModal";

const mockSaveBehaviorPattern = jest.fn();

const state = {
  behaviorPattern: null as null | {
    behaviorName: string;
    shortDescription: string;
    commonTriggers: string;
    riskTimesOrSituations: string;
    preferredRecoveryActions: string;
  },
};

jest.mock("../../state/BehaviorPatternContext", () => ({
  createEmptyBehaviorPattern: () => ({
    behaviorName: "",
    shortDescription: "",
    commonTriggers: "",
    riskTimesOrSituations: "",
    preferredRecoveryActions: "",
  }),
  useBehaviorPattern: () => ({
    behaviorPattern: state.behaviorPattern,
    saveBehaviorPattern: mockSaveBehaviorPattern,
  }),
}));

describe("BehaviorPatternSetupModal", () => {
  beforeEach(() => {
    state.behaviorPattern = null;
    mockSaveBehaviorPattern.mockReset();
  });

  it("shows the approved starter choices in order with no default selection", () => {
    const { getAllByRole, getByLabelText, getByText } = render(
      <BehaviorPatternSetupModal onClose={jest.fn()} visible />,
    );

    expect(getByText("Choose a starting point")).toBeTruthy();
    expect(
      getByText("Pick a plain-language pattern or add your own wording."),
    ).toBeTruthy();
    expect(getByLabelText("Behavior name").props.value).toBe("");

    expect(
      getAllByRole("radio").map((node) => node.props.accessibilityState.selected),
    ).toEqual([false, false, false, false, false, false, false, false]);
    expect(getAllByRole("radio").map((node) => node.props.accessibilityLabel)).toEqual([
      "Scrolling or phone use",
      "Avoidance or procrastination",
      "Shopping or spending",
      "Gambling or betting",
      "Anger or reactive behavior",
      "Pornography or sexual behavior",
      "Drinking or substance use",
      "Add your own",
    ]);
  });

  it("saves a starter-backed behavior name while keeping detail fields editable", () => {
    const onClose = jest.fn();
    const { getByLabelText, getByText } = render(
      <BehaviorPatternSetupModal onClose={onClose} visible />,
    );

    fireEvent.press(getByText("Shopping or spending"));
    fireEvent.changeText(getByLabelText("Short description"), "Impulse cart loop.");
    fireEvent.changeText(getByLabelText("Common triggers"), "Stress after work.");
    fireEvent.changeText(
      getByLabelText("Risk times or situations"),
      "Late nights.",
    );
    fireEvent.press(getByText("Save Behavior Pattern"));

    expect(mockSaveBehaviorPattern).toHaveBeenCalledWith({
      behaviorName: "Shopping or spending",
      shortDescription: "Impulse cart loop.",
      commonTriggers: "Stress after work.",
      riskTimesOrSituations: "Late nights.",
      preferredRecoveryActions: "",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("saves a custom behavior name and reopens it as Add your own with the exact text preserved", () => {
    state.behaviorPattern = {
      behaviorName: "Checking my ex's socials",
      shortDescription: "It escalates fast.",
      commonTriggers: "Loneliness.",
      riskTimesOrSituations: "After midnight.",
      preferredRecoveryActions: "",
    };

    const { getByDisplayValue, getByRole } = render(
      <BehaviorPatternSetupModal onClose={jest.fn()} visible />,
    );

    expect(getByDisplayValue("Checking my ex's socials")).toBeTruthy();
    expect(getByRole("radio", { name: "Add your own" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it("reopens a starter-matching behavior name with that starter selected", () => {
    state.behaviorPattern = {
      behaviorName: "Gambling or betting",
      shortDescription: "Chasing losses.",
      commonTriggers: "Sports nights.",
      riskTimesOrSituations: "Payday.",
      preferredRecoveryActions: "",
    };

    const { getByDisplayValue, getByRole } = render(
      <BehaviorPatternSetupModal onClose={jest.fn()} visible />,
    );

    expect(getByDisplayValue("Gambling or betting")).toBeTruthy();
    expect(
      getByRole("radio", { name: "Gambling or betting" }).props.accessibilityState,
    ).toEqual({ selected: true });
  });

  it("switches between starter and custom states without erasing an existing custom value before save", () => {
    state.behaviorPattern = {
      behaviorName: "My specific custom pattern",
      shortDescription: "",
      commonTriggers: "",
      riskTimesOrSituations: "",
      preferredRecoveryActions: "",
    };

    const { getByDisplayValue, getByLabelText, getByRole, getByText } = render(
      <BehaviorPatternSetupModal onClose={jest.fn()} visible />,
    );

    const behaviorNameInput = getByLabelText("Behavior name");

    fireEvent.press(getByText("Scrolling or phone use"));
    expect(getByDisplayValue("Scrolling or phone use")).toBeTruthy();

    fireEvent.press(getByText("Add your own"));
    expect(getByRole("radio", { name: "Add your own" }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(getByDisplayValue("Scrolling or phone use")).toBeTruthy();

    fireEvent.changeText(behaviorNameInput, "My specific custom pattern");
    expect(getByDisplayValue("My specific custom pattern")).toBeTruthy();
    expect(getByRole("radio", { name: "Add your own" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
