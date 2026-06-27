import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
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
  );
}
