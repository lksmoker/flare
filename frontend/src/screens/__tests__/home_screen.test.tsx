import { render } from "@testing-library/react-native";

import { HomeScreen } from "../home_screen";

describe("HomeScreen", () => {
  it("renders the Flare scaffold title and primary sections", () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText("Flare")).toBeTruthy();
    expect(getByText("Behavior Pattern")).toBeTruthy();
    expect(getByText("Recovery Memory")).toBeTruthy();
    expect(getByText("Send Flare")).toBeTruthy();
    expect(getByText("Checkpoint / Reflection")).toBeTruthy();
  });
});
