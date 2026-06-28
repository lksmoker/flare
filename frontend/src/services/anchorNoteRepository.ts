import type { AnchorNote } from "../state/AnchorNoteContext";
import { getSupabaseClient, type FlareSupabaseClient } from "./supabaseClient";

type AnchorNoteRow = {
  archived_at: string | null;
  costs_of_continuing: string | null;
  created_at: string;
  emergency_actions: string | null;
  future_self_message: string | null;
  grounded_self_reminder: string | null;
  id: string;
  notes: string | null;
  reasons_to_interrupt: string | null;
  status: "active" | "archived";
  supportive_phrase: string | null;
  updated_at: string;
  user_id: string;
  version: number;
};

export type PersistedAnchorNote = {
  anchorNote: AnchorNote;
  createdAt: string;
  id: string;
  updatedAt: string;
  userId: string;
  version: number;
};

export type SaveAnchorNoteInput = {
  anchorNote: AnchorNote;
  currentRecordId?: string | null;
  currentVersion?: number | null;
  userId: string;
};

export type AnchorNoteRepository = {
  loadActiveAnchorNote: (userId: string) => Promise<PersistedAnchorNote | null>;
  saveAnchorNote: (input: SaveAnchorNoteInput) => Promise<PersistedAnchorNote>;
};

function toNullableTrimmedText(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function mapAnchorNoteToSupabaseMutation(
  userId: string,
  anchorNote: AnchorNote,
  currentVersion?: number | null,
) {
  return {
    user_id: userId,
    reasons_to_interrupt: toNullableTrimmedText(anchorNote.interruptionReasons),
    costs_of_continuing: toNullableTrimmedText(anchorNote.continuingCosts),
    grounded_self_reminder: toNullableTrimmedText(anchorNote.groundedReminders),
    emergency_actions: toNullableTrimmedText(anchorNote.emergencyActions),
    supportive_phrase: toNullableTrimmedText(anchorNote.supportivePhrase),
    future_self_message: null,
    notes: null,
    version: currentVersion ? currentVersion + 1 : 1,
    status: "active" as const,
    archived_at: null,
  };
}

export function mapAnchorNoteRowToRecord(row: AnchorNoteRow): PersistedAnchorNote {
  return {
    anchorNote: {
      interruptionReasons: row.reasons_to_interrupt ?? "",
      continuingCosts: row.costs_of_continuing ?? "",
      groundedReminders: row.grounded_self_reminder ?? "",
      emergencyActions: row.emergency_actions ?? "",
      supportivePhrase: row.supportive_phrase ?? "",
    },
    createdAt: row.created_at,
    id: row.id,
    updatedAt: row.updated_at,
    userId: row.user_id,
    version: row.version,
  };
}

export function createAnchorNoteRepository(
  client: FlareSupabaseClient,
): AnchorNoteRepository {
  return {
    async loadActiveAnchorNote(userId) {
      const { data, error } = await client
        .from("anchor_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? mapAnchorNoteRowToRecord(data as AnchorNoteRow) : null;
    },

    async saveAnchorNote({
      anchorNote,
      currentRecordId,
      currentVersion,
      userId,
    }) {
      const mutation = mapAnchorNoteToSupabaseMutation(
        userId,
        anchorNote,
        currentVersion,
      );
      const query = currentRecordId
        ? client
            .from("anchor_notes")
            .update(mutation)
            .eq("id", currentRecordId)
            .eq("user_id", userId)
        : client.from("anchor_notes").insert(mutation);
      const { data, error } = await query.select("*").single();

      if (error) {
        throw error;
      }

      return mapAnchorNoteRowToRecord(data as AnchorNoteRow);
    },
  };
}

export function getAnchorNoteRepository() {
  return createAnchorNoteRepository(getSupabaseClient());
}
