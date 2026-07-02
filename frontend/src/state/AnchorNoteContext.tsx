import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type AnchorNoteRepository,
  getAnchorNoteRepository,
  type PersistedAnchorNote,
} from "../services/anchorNoteRepository";
import {
  resolveFlareSupabaseAuthState,
  type FlareSupabaseAuthState,
} from "../services/flareSupabaseAuth";
import { useOptionalFlareAuth } from "./FlareAuthContext";

export type AnchorNote = {
  interruptionReasons: string;
  continuingCosts: string;
  groundedReminders: string;
  emergencyActions: string;
  supportivePhrase: string;
};

type AnchorNoteContextValue = {
  isConfigured: boolean;
  anchorNote: AnchorNote | null;
  anchorNoteRecord: PersistedAnchorNote | null;
  saveAnchorNote: (nextAnchorNote: AnchorNote) => Promise<void>;
};

const AnchorNoteContext = createContext<AnchorNoteContextValue | undefined>(
  undefined,
);

function hasMeaningfulValue(value: string) {
  return value.trim().length > 0;
}

function normalizeAnchorNote(anchorNote: AnchorNote): AnchorNote {
  return {
    interruptionReasons: anchorNote.interruptionReasons.trim(),
    continuingCosts: anchorNote.continuingCosts.trim(),
    groundedReminders: anchorNote.groundedReminders.trim(),
    emergencyActions: anchorNote.emergencyActions.trim(),
    supportivePhrase: anchorNote.supportivePhrase.trim(),
  };
}

function isAnchorNoteConfigured(anchorNote: AnchorNote | null) {
  return Boolean(
    anchorNote &&
      hasMeaningfulValue(anchorNote.interruptionReasons) &&
      hasMeaningfulValue(anchorNote.supportivePhrase),
  );
}

export function createEmptyAnchorNote(): AnchorNote {
  return {
    interruptionReasons: "",
    continuingCosts: "",
    groundedReminders: "",
    emergencyActions: "",
    supportivePhrase: "",
  };
}

type AnchorNoteProviderProps = PropsWithChildren<{
  anchorNoteRepository?: AnchorNoteRepository;
  resolveAuthState?: () => Promise<FlareSupabaseAuthState>;
  authState?: FlareSupabaseAuthState;
}>;

const defaultAnchorNoteRepository: AnchorNoteRepository = {
  loadActiveAnchorNote(userId) {
    return getAnchorNoteRepository().loadActiveAnchorNote(userId);
  },
  saveAnchorNote(input) {
    return getAnchorNoteRepository().saveAnchorNote(input);
  },
};

function createLocalRecord(
  anchorNote: AnchorNote,
  currentRecord: PersistedAnchorNote | null,
): PersistedAnchorNote {
  const timestamp = currentRecord?.createdAt ?? new Date().toISOString();

  return {
    anchorNote,
    createdAt: timestamp,
    id: currentRecord?.id ?? "local-only-anchor-note",
    updatedAt: new Date().toISOString(),
    userId: currentRecord?.userId ?? null,
    version: currentRecord?.version ?? 0,
  };
}

export function AnchorNoteProvider({
  anchorNoteRepository = defaultAnchorNoteRepository,
  children,
  resolveAuthState = resolveFlareSupabaseAuthState,
  authState: authStateOverride,
}: AnchorNoteProviderProps) {
  const authContext = useOptionalFlareAuth();
  const [record, setRecord] = useState<PersistedAnchorNote | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAnchorNote() {
      const activeAuthState =
        authStateOverride ?? authContext?.authState ?? (await resolveAuthState());

      if (activeAuthState.kind !== "authenticated") {
        if (isActive) {
          setRecord(null);
        }

        return;
      }

      try {
        const persistedRecord = await anchorNoteRepository.loadActiveAnchorNote(
          activeAuthState.userId,
        );

        if (isActive) {
          setRecord(persistedRecord);
        }
      } catch (error) {
        console.warn("Failed to load persisted Anchor Note.", error);
      }
    }

    void loadAnchorNote();

    return () => {
      isActive = false;
    };
  }, [
    anchorNoteRepository,
    authContext?.authState,
    authStateOverride,
    resolveAuthState,
  ]);

  const anchorNote = record?.anchorNote ?? null;

  const value = useMemo<AnchorNoteContextValue>(
    () => ({
      isConfigured: isAnchorNoteConfigured(anchorNote),
      anchorNote,
      anchorNoteRecord: record,
      saveAnchorNote: async (nextAnchorNote) => {
        const normalizedAnchorNote = normalizeAnchorNote(nextAnchorNote);
        const localRecord = createLocalRecord(normalizedAnchorNote, record);

        setRecord(localRecord);

        try {
          const authState =
            authStateOverride ??
            authContext?.authState ??
            (await resolveAuthState());

          if (authState.kind !== "authenticated") {
            return;
          }

          const persistedRecord = await anchorNoteRepository.saveAnchorNote({
            anchorNote: normalizedAnchorNote,
            currentRecordId:
              record?.userId === authState.userId ? record.id : null,
            currentVersion:
              record?.userId === authState.userId ? record.version : null,
            userId: authState.userId,
          });

          setRecord(persistedRecord);
        } catch (error) {
          console.warn("Failed to persist Anchor Note.", error);
        }
      },
    }),
    [
      anchorNote,
      anchorNoteRepository,
      authContext?.authState,
      authStateOverride,
      record,
      resolveAuthState,
    ],
  );

  return (
    <AnchorNoteContext.Provider value={value}>
      {children}
    </AnchorNoteContext.Provider>
  );
}

export function useAnchorNote() {
  const context = useContext(AnchorNoteContext);

  if (!context) {
    throw new Error("useAnchorNote must be used within an AnchorNoteProvider.");
  }

  return context;
}
