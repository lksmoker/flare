import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type BehaviorPatternRepository,
  getBehaviorPatternRepository,
  type PersistedBehaviorPattern,
} from "../services/behaviorPatternRepository";
import {
  resolveFlareSupabaseAuthState,
  type FlareSupabaseAuthState,
} from "../services/flareSupabaseAuth";

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
  saveBehaviorPattern: (nextPattern: BehaviorPattern) => Promise<void>;
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

type BehaviorPatternProviderProps = PropsWithChildren<{
  behaviorPatternRepository?: BehaviorPatternRepository;
  resolveAuthState?: () => Promise<FlareSupabaseAuthState>;
}>;

const defaultBehaviorPatternRepository: BehaviorPatternRepository = {
  loadActiveBehaviorPattern(userId) {
    return getBehaviorPatternRepository().loadActiveBehaviorPattern(userId);
  },
  saveBehaviorPattern(input) {
    return getBehaviorPatternRepository().saveBehaviorPattern(input);
  },
};

function createLocalRecord(
  behaviorPattern: BehaviorPattern,
  currentRecord: PersistedBehaviorPattern | null,
): PersistedBehaviorPattern {
  const timestamp = currentRecord?.createdAt ?? new Date().toISOString();

  return {
    behaviorPattern,
    createdAt: timestamp,
    id: currentRecord?.id ?? "local-only-behavior-pattern",
    updatedAt: new Date().toISOString(),
    userId: currentRecord?.userId ?? "local-only",
  };
}

export function BehaviorPatternProvider({
  behaviorPatternRepository = defaultBehaviorPatternRepository,
  children,
  resolveAuthState = resolveFlareSupabaseAuthState,
}: BehaviorPatternProviderProps) {
  const [record, setRecord] = useState<PersistedBehaviorPattern | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadBehaviorPattern() {
      try {
        const authState = await resolveAuthState();

        if (authState.kind !== "authenticated") {
          return;
        }

        const persistedRecord =
          await behaviorPatternRepository.loadActiveBehaviorPattern(
            authState.userId,
          );

        if (isActive && persistedRecord) {
          setRecord(persistedRecord);
        }
      } catch (error) {
        console.warn("Failed to load persisted Behavior Pattern.", error);
      }
    }

    void loadBehaviorPattern();

    return () => {
      isActive = false;
    };
  }, [behaviorPatternRepository, resolveAuthState]);

  const behaviorPattern = record?.behaviorPattern ?? null;

  const value = useMemo<BehaviorPatternContextValue>(
    () => ({
      behaviorPattern,
      isConfigured: isBehaviorPatternConfigured(behaviorPattern),
      saveBehaviorPattern: async (nextPattern) => {
        const normalizedPattern = normalizeBehaviorPattern(nextPattern);
        const localRecord = createLocalRecord(normalizedPattern, record);

        setRecord(localRecord);

        try {
          const authState = await resolveAuthState();

          if (authState.kind !== "authenticated") {
            return;
          }

          const persistedRecord =
            await behaviorPatternRepository.saveBehaviorPattern({
              behaviorPattern: normalizedPattern,
              currentRecordId:
                record?.userId === authState.userId ? record.id : null,
              userId: authState.userId,
            });

          setRecord(persistedRecord);
        } catch (error) {
          console.warn("Failed to persist Behavior Pattern.", error);
        }
      },
    }),
    [behaviorPattern, behaviorPatternRepository, record, resolveAuthState],
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
