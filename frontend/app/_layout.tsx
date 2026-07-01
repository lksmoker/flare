import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AnchorNoteProvider } from "../src/state/AnchorNoteContext";
import { BehaviorPatternProvider } from "../src/state/BehaviorPatternContext";
import { FlareAuthProvider } from "../src/state/FlareAuthContext";
import { FlareEventProvider } from "../src/state/FlareEventContext";

export default function RootLayout() {
  return (
    <FlareAuthProvider>
      <BehaviorPatternProvider>
        <AnchorNoteProvider>
          <FlareEventProvider>
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
          </FlareEventProvider>
        </AnchorNoteProvider>
      </BehaviorPatternProvider>
    </FlareAuthProvider>
  );
}
