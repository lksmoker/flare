import { fireEvent, render } from "@testing-library/react-native";

import { CheckpointReflectionModal } from "../CheckpointReflectionModal";

const mockSaveCheckpointReflection = jest.fn();

jest.mock("../../state/FlareEventContext", () => ({
  createEmptyCheckpointReflection: () => ({
    actionTaken: "",
    howIFeelNow: "",
    note: "",
    outcome: "",
    whatHappened: "",
    whatHelped: "",
  }),
  useFlareEvents: () => ({
    saveCheckpointReflection: mockSaveCheckpointReflection,
  }),
}));

describe("CheckpointReflectionModal", () => {
  beforeEach(() => {
    mockSaveCheckpointReflection.mockReset();
  });

  it("saves an allowed outcome selection instead of freeform text", () => {
    const onSave = jest.fn();
    const { getByText, getByLabelText } = render(
      <CheckpointReflectionModal
        flareEvent={{
          anchorNoteId: null,
          anchorNoteVersion: null,
          archivedAt: null,
          behaviorDescriptionSnapshot: null,
          behaviorLabelSnapshot: "Late-night scrolling",
          behaviorPatternId: null,
          checkpoint: null,
          closedAt: null,
          createdAt: "2026-07-02T00:00:00.000Z",
          id: "event-1",
          responseMode: "configured",
          status: "active",
          supportActionShown: null,
          supportActionTaken: null,
          updatedAt: "2026-07-02T00:00:00.000Z",
          userId: "user-123",
        }}
        onClose={jest.fn()}
        onSave={onSave}
        visible
      />,
    );

    fireEvent.changeText(getByLabelText("What happened?"), "A spike hit.");
    fireEvent.changeText(getByLabelText("What helped?"), "Cold water.");
    fireEvent.changeText(getByLabelText("How do I feel now?"), "Steadier.");
    fireEvent.press(getByText("Reduced"));
    fireEvent.changeText(getByLabelText("Optional note"), "Two minutes helped.");
    fireEvent.press(getByText("Save Reflection"));

    expect(mockSaveCheckpointReflection).toHaveBeenCalledWith({
      actionTaken: "",
      howIFeelNow: "Steadier.",
      note: "Two minutes helped.",
      outcome: "reduced",
      whatHappened: "A spike hit.",
      whatHelped: "Cold water.",
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
