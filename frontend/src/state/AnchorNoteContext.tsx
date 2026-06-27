import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

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
  saveAnchorNote: (nextAnchorNote: AnchorNote) => void;
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

export function AnchorNoteProvider({ children }: PropsWithChildren) {
  const [anchorNote, setAnchorNote] = useState<AnchorNote | null>(null);

  const value = useMemo<AnchorNoteContextValue>(
    () => ({
      isConfigured: isAnchorNoteConfigured(anchorNote),
      anchorNote,
      saveAnchorNote: (nextAnchorNote) => {
        setAnchorNote(normalizeAnchorNote(nextAnchorNote));
      },
    }),
    [anchorNote],
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
