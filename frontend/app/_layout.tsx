import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f7f2e8",
          },
          headerTintColor: "#1f2937",
          contentStyle: {
            backgroundColor: "#f3ede2",
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Flare" }} />
        <Stack.Screen
          name="behavior-pattern"
          options={{ title: "Behavior Pattern" }}
        />
        <Stack.Screen
          name="recovery-memory"
          options={{ title: "Recovery Memory" }}
        />
        <Stack.Screen name="send-flare" options={{ title: "Send Flare" }} />
        <Stack.Screen
          name="checkpoint-reflection"
          options={{ title: "Checkpoint / Reflection" }}
        />
      </Stack>
    </>
  );
}
