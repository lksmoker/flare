import type { SaveCheckpointReflectionInput } from "../state/FlareEventContext";
import { getSupabaseClient, type FlareSupabaseClient } from "./supabaseClient";
import {
  mapCheckpointReflectionRowToRecord,
  type PersistedCheckpointReflection,
} from "./flareEventRepository";

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

export type SaveCheckpointReflectionMutationInput = {
  checkpointReflection: SaveCheckpointReflectionInput;
  flareEventId: string;
  userId: string;
};

export type CheckpointReflectionRepository = {
  saveCheckpointReflection: (
    input: SaveCheckpointReflectionMutationInput,
  ) => Promise<PersistedCheckpointReflection>;
};

function toNullableTrimmedText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOutcome(outcome: string) {
  const trimmed = outcome.trim();
  const normalized = trimmed.toLowerCase();

  switch (normalized) {
    case "avoided":
    case "delayed":
    case "reduced":
    case "continued":
    case "unclear":
      return normalized;
    default:
      return trimmed.length > 0 ? "unclear" : null;
  }
}

export function mapCheckpointReflectionInputToSupabaseMutation(
  input: SaveCheckpointReflectionMutationInput,
) {
  const checkpointReflection = input.checkpointReflection;

  return {
    action_taken: toNullableTrimmedText(checkpointReflection.actionTaken),
    flare_event_id: input.flareEventId,
    how_i_feel_now: toNullableTrimmedText(checkpointReflection.howIFeelNow),
    note: toNullableTrimmedText(checkpointReflection.note),
    outcome: normalizeOutcome(checkpointReflection.outcome),
    user_id: input.userId,
    what_happened: toNullableTrimmedText(checkpointReflection.whatHappened),
    what_helped: toNullableTrimmedText(checkpointReflection.whatHelped),
  };
}

export function createCheckpointReflectionRepository(
  client: FlareSupabaseClient,
): CheckpointReflectionRepository {
  return {
    async saveCheckpointReflection(input) {
      const { data, error } = await client
        .from("checkpoint_reflections")
        .insert(mapCheckpointReflectionInputToSupabaseMutation(input))
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return mapCheckpointReflectionRowToRecord(data as CheckpointReflectionRow);
    },
  };
}

export function getCheckpointReflectionRepository() {
  return createCheckpointReflectionRepository(getSupabaseClient());
}
