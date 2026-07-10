import AsyncStorage from "@react-native-async-storage/async-storage";

export const FLARE_WELCOME_COMPLETION_KEY = "flare.welcome.completed.v1";

export async function readWelcomeCompletion() {
  try {
    const storedValue = await AsyncStorage.getItem(FLARE_WELCOME_COMPLETION_KEY);
    return storedValue === "true";
  } catch {
    return false;
  }
}

export async function writeWelcomeCompletion() {
  try {
    await AsyncStorage.setItem(FLARE_WELCOME_COMPLETION_KEY, "true");
  } catch {
    // Continue even if local persistence is unavailable for this runtime.
  }
}
