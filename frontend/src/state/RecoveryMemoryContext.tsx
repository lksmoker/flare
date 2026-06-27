import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type RecoveryMemory = {
  interruptionReasons: string;
  continuingCosts: string;
  groundedReminders: string;
  emergencyActions: string;
  supportivePhrase: string;
};

type RecoveryMemoryContextValue = {
  isConfigured: boolean;
  recoveryMemory: RecoveryMemory | null;
  saveRecoveryMemory: (nextRecoveryMemory: RecoveryMemory) => void;
};

const RecoveryMemoryContext = createContext<
  RecoveryMemoryContextValue | undefined
>(undefined);

function hasMeaningfulValue(value: string) {
  return value.trim().length > 0;
}

function normalizeRecoveryMemory(
  recoveryMemory: RecoveryMemory,
): RecoveryMemory {
  return {
    interruptionReasons: recoveryMemory.interruptionReasons.trim(),
    continuingCosts: recoveryMemory.continuingCosts.trim(),
    groundedReminders: recoveryMemory.groundedReminders.trim(),
    emergencyActions: recoveryMemory.emergencyActions.trim(),
    supportivePhrase: recoveryMemory.supportivePhrase.trim(),
  };
}

function isRecoveryMemoryConfigured(recoveryMemory: RecoveryMemory | null) {
  return Boolean(
    recoveryMemory &&
      hasMeaningfulValue(recoveryMemory.interruptionReasons) &&
      hasMeaningfulValue(recoveryMemory.supportivePhrase),
  );
}

export function createEmptyRecoveryMemory(): RecoveryMemory {
  return {
    interruptionReasons: "",
    continuingCosts: "",
    groundedReminders: "",
    emergencyActions: "",
    supportivePhrase: "",
  };
}

export function RecoveryMemoryProvider({ children }: PropsWithChildren) {
  const [recoveryMemory, setRecoveryMemory] = useState<RecoveryMemory | null>(
    null,
  );

  const value = useMemo<RecoveryMemoryContextValue>(
    () => ({
      isConfigured: isRecoveryMemoryConfigured(recoveryMemory),
      recoveryMemory,
      saveRecoveryMemory: (nextRecoveryMemory) => {
        setRecoveryMemory(normalizeRecoveryMemory(nextRecoveryMemory));
      },
    }),
    [recoveryMemory],
  );

  return (
    <RecoveryMemoryContext.Provider value={value}>
      {children}
    </RecoveryMemoryContext.Provider>
  );
}

export function useRecoveryMemory() {
  const context = useContext(RecoveryMemoryContext);

  if (!context) {
    throw new Error(
      "useRecoveryMemory must be used within a RecoveryMemoryProvider.",
    );
  }

  return context;
}
