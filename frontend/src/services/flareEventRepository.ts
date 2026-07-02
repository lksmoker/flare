import type {
  CheckpointReflection,
  FlareEvent,
  FlareEventStatus,
} from "../state/FlareEventContext";
import { getSupabaseClient, type FlareSupabaseClient } from "./supabaseClient";

type CheckpointReflectionRow = {
  action_taken: string | null;
  created_at: string;
  flare_event_id: string;
  how_i_feel_now: string | null;
  id: string;
  note: string | null;
  outcome: string | null;
  updated_at: string;
  user_id: string;
  what_happened: string | null;
  what_helped: string | null;
};

type FlareEventRow = {
  anchor_note_id: string | null;
  anchor_note_version: number | null;
  archived_at: string | null;
  behavior_description_snapshot: string | null;
  behavior_label_snapshot: string;
  behavior_pattern_id: string | null;
  checkpoint_reflections?: CheckpointReflectionRow[] | null;
  closed_at: string | null;
  created_at: string;
  id: string;
  response_mode: "configured" | "fallback-generic";
  status: FlareEventStatus;
  support_action_shown: string | null;
  support_action_taken: string | null;
  updated_at: string;
  user_id: string;
};

export type PersistedCheckpointReflection = {
  checkpointReflection: CheckpointReflection;
  flareEventId: string;
  id: string;
  updatedAt: string;
  userId: string;
};

export type PersistedFlareEvent = {
  createdAt: string;
  flareEvent: FlareEvent;
  id: string;
  updatedAt: string;
  userId: string;
};

export type LoadFlareEventsOptions = {
  includeArchived?: boolean;
};

export type CreateFlareEventMutationInput = {
  anchorNoteId?: string | null;
  anchorNoteVersion?: number | null;
  behaviorDescriptionSnapshot?: string | null;
  behaviorLabelSnapshot: string;
  behaviorPatternId?: string | null;
  responseMode: "configured" | "fallback-generic";
  supportActionShown?: string | null;
  supportActionTaken?: string | null;
  userId: string;
};

export type UpdateFlareEventStatusInput = {
  closedAt?: string | null;
  eventId: string;
  status: FlareEventStatus;
  supportActionTaken?: string | null;
  userId: string;
};

export type ArchiveFlareEventInput = {
  archivedAt?: string;
  eventId: string;
  userId: string;
};

export type RestoreFlareEventInput = {
  eventId: string;
  userId: string;
};

export type FlareEventRepository = {
  archiveFlareEvent: (
    input: ArchiveFlareEventInput,
  ) => Promise<PersistedFlareEvent>;
  createFlareEvent: (
    input: CreateFlareEventMutationInput,
  ) => Promise<PersistedFlareEvent>;
  loadFlareEvents: (
    userId: string,
    options?: LoadFlareEventsOptions,
  ) => Promise<PersistedFlareEvent[]>;
  restoreFlareEvent: (
    input: RestoreFlareEventInput,
  ) => Promise<PersistedFlareEvent>;
  updateFlareEventStatus: (
    input: UpdateFlareEventStatusInput,
  ) => Promise<PersistedFlareEvent>;
};

function toNullableTrimmedText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function mapCheckpointReflectionRowToRecord(
  row: CheckpointReflectionRow,
): PersistedCheckpointReflection {
  return {
    checkpointReflection: {
      actionTaken: row.action_taken ?? "",
      createdAt: row.created_at,
      howIFeelNow: row.how_i_feel_now ?? "",
      id: row.id,
      note: row.note ?? "",
      outcome: row.outcome ?? "",
      updatedAt: row.updated_at,
      userId: row.user_id,
      whatHappened: row.what_happened ?? "",
      whatHelped: row.what_helped ?? "",
    },
    flareEventId: row.flare_event_id,
    id: row.id,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function mapFlareEventRowToRecord(row: FlareEventRow): PersistedFlareEvent {
  const checkpointRow = row.checkpoint_reflections?.[0] ?? null;

  return {
    createdAt: row.created_at,
    flareEvent: {
      anchorNoteId: row.anchor_note_id,
      anchorNoteVersion: row.anchor_note_version,
      archivedAt: row.archived_at,
      behaviorDescriptionSnapshot: row.behavior_description_snapshot,
      behaviorLabelSnapshot: row.behavior_label_snapshot,
      behaviorPatternId: row.behavior_pattern_id,
      checkpoint: checkpointRow
        ? mapCheckpointReflectionRowToRecord(checkpointRow).checkpointReflection
        : null,
      closedAt: row.closed_at,
      createdAt: row.created_at,
      id: row.id,
      responseMode: row.response_mode,
      status: row.status,
      supportActionShown: row.support_action_shown,
      supportActionTaken: row.support_action_taken,
      updatedAt: row.updated_at,
      userId: row.user_id,
    },
    id: row.id,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function mapCreateFlareEventInputToSupabaseMutation(
  input: CreateFlareEventMutationInput,
) {
  return {
    anchor_note_id: input.anchorNoteId ?? null,
    anchor_note_version: input.anchorNoteVersion ?? null,
    behavior_description_snapshot: toNullableTrimmedText(
      input.behaviorDescriptionSnapshot,
    ),
    behavior_label_snapshot: input.behaviorLabelSnapshot.trim(),
    behavior_pattern_id: input.behaviorPatternId ?? null,
    response_mode: input.responseMode,
    status: "active" as const,
    support_action_shown: toNullableTrimmedText(input.supportActionShown),
    support_action_taken: toNullableTrimmedText(input.supportActionTaken),
    user_id: input.userId,
  };
}

export function mapUpdateFlareEventStatusInputToSupabaseMutation(
  input: UpdateFlareEventStatusInput,
) {
  return {
    closed_at: input.status === "closed" ? input.closedAt ?? null : null,
    status: input.status,
    support_action_taken: toNullableTrimmedText(input.supportActionTaken),
  };
}

export function mapArchiveFlareEventInputToSupabaseMutation(
  input: ArchiveFlareEventInput,
) {
  return {
    archived_at: input.archivedAt ?? new Date().toISOString(),
  };
}

export function mapRestoreFlareEventInputToSupabaseMutation() {
  return {
    archived_at: null,
  };
}

export function createFlareEventRepository(
  client: FlareSupabaseClient,
): FlareEventRepository {
  return {
    async archiveFlareEvent({ archivedAt, eventId, userId }) {
      const { data, error } = await client
        .from("flare_events")
        .update(
          mapArchiveFlareEventInputToSupabaseMutation({
            archivedAt,
            eventId,
            userId,
          }),
        )
        .eq("id", eventId)
        .eq("user_id", userId)
        .select("*, checkpoint_reflections(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapFlareEventRowToRecord(data as FlareEventRow);
    },

    async createFlareEvent(input) {
      const { data, error } = await client
        .from("flare_events")
        .insert(mapCreateFlareEventInputToSupabaseMutation(input))
        .select("*, checkpoint_reflections(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapFlareEventRowToRecord(data as FlareEventRow);
    },

    async loadFlareEvents(userId, options) {
      let query = client
        .from("flare_events")
        .select("*, checkpoint_reflections(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!options?.includeArchived) {
        query = query.is("archived_at", null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data as FlareEventRow[]).map(mapFlareEventRowToRecord);
    },

    async restoreFlareEvent({ eventId, userId }) {
      const { data, error } = await client
        .from("flare_events")
        .update(mapRestoreFlareEventInputToSupabaseMutation())
        .eq("id", eventId)
        .eq("user_id", userId)
        .select("*, checkpoint_reflections(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapFlareEventRowToRecord(data as FlareEventRow);
    },

    async updateFlareEventStatus({
      closedAt,
      eventId,
      status,
      supportActionTaken,
      userId,
    }) {
      const { data, error } = await client
        .from("flare_events")
        .update(
          mapUpdateFlareEventStatusInputToSupabaseMutation({
            closedAt,
            eventId,
            status,
            supportActionTaken,
            userId,
          }),
        )
        .eq("id", eventId)
        .eq("user_id", userId)
        .select("*, checkpoint_reflections(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapFlareEventRowToRecord(data as FlareEventRow);
    },
  };
}

export function getFlareEventRepository() {
  return createFlareEventRepository(getSupabaseClient());
}
