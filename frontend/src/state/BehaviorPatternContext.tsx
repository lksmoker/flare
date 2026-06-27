import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type BehaviorPattern = {
  behaviorName: string;
  shortDescription: string;
  commonTriggers: string;
  riskTimesOrSituations: string;
  preferredRecoveryActions: string;
};

type BehaviorPatternContextValue = {
  behaviorPattern: BehaviorPattern | null;
  isConfigured: boolean;
  saveBehaviorPattern: (nextPattern: BehaviorPattern) => void;
};

const BehaviorPatternContext = createContext<
  BehaviorPatternContextValue | undefined
>(undefined);

function hasMeaningfulValue(value: string) {
  return value.trim().length > 0;
}

function normalizeBehaviorPattern(
  behaviorPattern: BehaviorPattern,
): BehaviorPattern {
  return {
    behaviorName: behaviorPattern.behaviorName.trim(),
    shortDescription: behaviorPattern.shortDescription.trim(),
    commonTriggers: behaviorPattern.commonTriggers.trim(),
    riskTimesOrSituations: behaviorPattern.riskTimesOrSituations.trim(),
    preferredRecoveryActions: behaviorPattern.preferredRecoveryActions.trim(),
  };
}

function isBehaviorPatternConfigured(behaviorPattern: BehaviorPattern | null) {
  return Boolean(
    behaviorPattern &&
      hasMeaningfulValue(behaviorPattern.behaviorName) &&
      hasMeaningfulValue(behaviorPattern.preferredRecoveryActions),
  );
}

export function createEmptyBehaviorPattern(): BehaviorPattern {
  return {
    behaviorName: "",
    shortDescription: "",
    commonTriggers: "",
    riskTimesOrSituations: "",
    preferredRecoveryActions: "",
  };
}

export function BehaviorPatternProvider({ children }: PropsWithChildren) {
  const [behaviorPattern, setBehaviorPattern] = useState<BehaviorPattern | null>(
    null,
  );

  const value = useMemo<BehaviorPatternContextValue>(
    () => ({
      behaviorPattern,
      isConfigured: isBehaviorPatternConfigured(behaviorPattern),
      saveBehaviorPattern: (nextPattern) => {
        setBehaviorPattern(normalizeBehaviorPattern(nextPattern));
      },
    }),
    [behaviorPattern],
  );

  return (
    <BehaviorPatternContext.Provider value={value}>
      {children}
    </BehaviorPatternContext.Provider>
  );
}

export function useBehaviorPattern() {
  const context = useContext(BehaviorPatternContext);

  if (!context) {
    throw new Error(
      "useBehaviorPattern must be used within a BehaviorPatternProvider.",
    );
  }

  return context;
}
