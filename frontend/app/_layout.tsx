import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BehaviorPatternProvider } from "../src/state/BehaviorPatternContext";

export default function RootLayout() {
  return (
    <BehaviorPatternProvider>
      <>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "#f3ede2",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="history" />
          <Stack.Screen name="customize" />
        </Stack>
      </>
    </BehaviorPatternProvider>
  );
}
