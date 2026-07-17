import {
  getSupabaseClient,
  type FlareSupabaseClient,
} from "./supabaseClient";

export type FlareTraceFailureStage =
  | "client_initiation"
  | "request_transport"
  | "backend_auth";

export type FlareTraceFailureCode =
  | "auth_session_missing"
  | "backend_unauthorized"
  | "client_trace_write_failed"
  | "request_network_failed";

export type CreateInitiatedFlareTraceInput = {
  clientInitiatedAt?: string;
  isTest?: boolean;
  responseMode: "configured" | "fallback-generic";
  traceId: string;
  userId: string;
};

export type MarkFailedFlareTraceInput = {
  failureCode: FlareTraceFailureCode;
  failureStage: FlareTraceFailureStage;
  terminalHttpStatus?: number | null;
  traceId: string;
  userId: string;
};

export type FlareTraceRepository = {
  createInitiatedTrace: (
    input: CreateInitiatedFlareTraceInput,
  ) => Promise<void>;
  markFailedTrace: (input: MarkFailedFlareTraceInput) => Promise<void>;
};

export function createFlareTraceRepository(
  client: FlareSupabaseClient = getSupabaseClient(),
): FlareTraceRepository {
  return {
    async createInitiatedTrace({
      clientInitiatedAt,
      isTest,
      responseMode,
      traceId,
      userId,
    }) {
      const { error } = await client.from("flare_event_traces").insert({
        client_initiated_at: clientInitiatedAt ?? new Date().toISOString(),
        is_test: isTest ?? false,
        response_mode: responseMode,
        route_name: "flare_event_create",
        status: "initiated",
        trace_id: traceId,
        user_id: userId,
      });

      if (error) {
        if (error.code === "23505") {
          return;
        }
        throw error;
      }
    },

    async markFailedTrace({
      failureCode,
      failureStage,
      terminalHttpStatus,
      traceId,
      userId,
    }) {
      const { error } = await client
        .from("flare_event_traces")
        .update({
          failed_at: new Date().toISOString(),
          failure_code: failureCode,
          failure_stage: failureStage,
          status: "failed",
          terminal_http_status: terminalHttpStatus ?? null,
        })
        .eq("trace_id", traceId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
    },
  };
}
