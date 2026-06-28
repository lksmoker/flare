import type { BehaviorPattern } from "../state/BehaviorPatternContext";
import { getSupabaseClient, type FlareSupabaseClient } from "./supabaseClient";

type BehaviorPatternRow = {
  archived_at: string | null;
  common_triggers: string | null;
  created_at: string;
  description: string | null;
  id: string;
  is_primary: boolean;
  label: string;
  preferred_recovery_actions: string | null;
  risk_times_or_situations: string | null;
  status: "active" | "archived";
  updated_at: string;
  user_id: string;
};

export type PersistedBehaviorPattern = {
  behaviorPattern: BehaviorPattern;
  createdAt: string;
  id: string;
  updatedAt: string;
  userId: string;
};

export type SaveBehaviorPatternInput = {
  behaviorPattern: BehaviorPattern;
  currentRecordId?: string | null;
  userId: string;
};

export type BehaviorPatternRepository = {
  loadActiveBehaviorPattern: (
    userId: string,
  ) => Promise<PersistedBehaviorPattern | null>;
  saveBehaviorPattern: (
    input: SaveBehaviorPatternInput,
  ) => Promise<PersistedBehaviorPattern>;
};

function toNullableTrimmedText(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function mapBehaviorPatternToSupabaseMutation(
  userId: string,
  behaviorPattern: BehaviorPattern,
) {
  return {
    user_id: userId,
    label: behaviorPattern.behaviorName.trim(),
    description: toNullableTrimmedText(behaviorPattern.shortDescription),
    common_triggers: toNullableTrimmedText(behaviorPattern.commonTriggers),
    risk_times_or_situations: toNullableTrimmedText(
      behaviorPattern.riskTimesOrSituations,
    ),
    preferred_recovery_actions: toNullableTrimmedText(
      behaviorPattern.preferredRecoveryActions,
    ),
    status: "active" as const,
    is_primary: true,
    archived_at: null,
  };
}

export function mapBehaviorPatternRowToRecord(
  row: BehaviorPatternRow,
): PersistedBehaviorPattern {
  return {
    behaviorPattern: {
      behaviorName: row.label,
      shortDescription: row.description ?? "",
      commonTriggers: row.common_triggers ?? "",
      riskTimesOrSituations: row.risk_times_or_situations ?? "",
      preferredRecoveryActions: row.preferred_recovery_actions ?? "",
    },
    createdAt: row.created_at,
    id: row.id,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function createBehaviorPatternRepository(
  client: FlareSupabaseClient,
): BehaviorPatternRepository {
  return {
    async loadActiveBehaviorPattern(userId) {
      const { data, error } = await client
        .from("behavior_patterns")
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

      return data
        ? mapBehaviorPatternRowToRecord(data as BehaviorPatternRow)
        : null;
    },

    async saveBehaviorPattern({ behaviorPattern, currentRecordId, userId }) {
      const mutation = mapBehaviorPatternToSupabaseMutation(
        userId,
        behaviorPattern,
      );
      const query = currentRecordId
        ? client
            .from("behavior_patterns")
            .update(mutation)
            .eq("id", currentRecordId)
            .eq("user_id", userId)
        : client.from("behavior_patterns").insert(mutation);
      const { data, error } = await query.select("*").single();

      if (error) {
        throw error;
      }

      return mapBehaviorPatternRowToRecord(data as BehaviorPatternRow);
    },
  };
}

export function getBehaviorPatternRepository() {
  return createBehaviorPatternRepository(getSupabaseClient());
}
