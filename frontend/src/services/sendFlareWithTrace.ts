import { createIdempotencyKey } from "./idempotency";
import {
  createFlareResponse,
  FlareResponseApiError,
  type FlarePlanRun,
} from "./flareResponseApi";
import {
  createFlareTraceRepository,
  type FlareTraceRepository,
} from "./flareTraceRepository";
import type { FlareEvent } from "../state/FlareEventContext";

type SendFlareResponseDeps = Parameters<typeof createFlareResponse>[1];

type SendSignedInFlareInput = {
  anchorNoteId?: string | null;
  anchorNoteVersion?: number | null;
  behaviorDescriptionSnapshot?: string | null;
  behaviorLabelSnapshot: string;
  behaviorPatternId?: string | null;
  existingTraceId?: string | null;
  isTest?: boolean;
  responseMode: "configured" | "fallback-generic";
  supportActionShown?: string | null;
  userId: string;
};

type SendSignedInFlareDeps = {
  createTraceId?: () => string;
  responseDeps?: SendFlareResponseDeps;
  traceRepository?: FlareTraceRepository;
};

export class SignedInFlareSendError extends Error {
  code: string;
  retryTraceId: string;
  statusCode: number;

  constructor({
    code,
    message,
    retryTraceId,
    statusCode,
  }: {
    code: string;
    message: string;
    retryTraceId: string;
    statusCode: number;
  }) {
    super(message);
    this.name = "SignedInFlareSendError";
    this.code = code;
    this.retryTraceId = retryTraceId;
    this.statusCode = statusCode;
  }
}

export async function sendSignedInFlareWithTrace(
  input: SendSignedInFlareInput,
  deps: SendSignedInFlareDeps = {},
): Promise<{ flareEvent: FlareEvent; run: FlarePlanRun | null; traceId: string }> {
  const traceId = input.existingTraceId?.trim() || (deps.createTraceId ?? createIdempotencyKey)();
  const traceRepository =
    deps.traceRepository ?? createSafeTraceRepository();

  let initiationWriteFailed = false;
  try {
    await traceRepository.createInitiatedTrace({
      isTest: input.isTest ?? false,
      responseMode: input.responseMode,
      traceId,
      userId: input.userId,
    });
  } catch {
    initiationWriteFailed = true;
  }

  try {
    const created = await createFlareResponse(
      {
        anchorNoteId: input.anchorNoteId ?? null,
        anchorNoteVersion: input.anchorNoteVersion ?? null,
        behaviorDescriptionSnapshot: input.behaviorDescriptionSnapshot ?? null,
        behaviorLabelSnapshot: input.behaviorLabelSnapshot,
        behaviorPatternId: input.behaviorPatternId ?? null,
        idempotencyKey: traceId,
        responseMode: input.responseMode,
        supportActionShown: input.supportActionShown ?? null,
      },
      deps.responseDeps,
    );

    return { ...created, traceId };
  } catch (error) {
    const normalizedError = normalizeSignedInFlareError(error, traceId);
    if (!initiationWriteFailed) {
      await recordClientObservedFailure({
        error: normalizedError,
        traceId,
        traceRepository,
        userId: input.userId,
      });
    }
    throw normalizedError;
  }
}

function createSafeTraceRepository(): FlareTraceRepository {
  try {
    return createFlareTraceRepository();
  } catch {
    return {
      async createInitiatedTrace() {
        return;
      },
      async markFailedTrace() {
        return;
      },
    };
  }
}

function normalizeSignedInFlareError(error: unknown, traceId: string) {
  if (error instanceof FlareResponseApiError) {
    return new SignedInFlareSendError({
      code: error.code,
      message: error.message,
      retryTraceId: traceId,
      statusCode: error.statusCode,
    });
  }

  return new SignedInFlareSendError({
    code: "flare_response_request_failed",
    message: "Flare could not be created right now.",
    retryTraceId: traceId,
    statusCode: 0,
  });
}

async function recordClientObservedFailure({
  error,
  traceId,
  traceRepository,
  userId,
}: {
  error: SignedInFlareSendError;
  traceId: string;
  traceRepository: FlareTraceRepository;
  userId: string;
}) {
  try {
    if (error.code === "auth_session_missing") {
      await traceRepository.markFailedTrace({
        failureCode: "auth_session_missing",
        failureStage: "client_initiation",
        terminalHttpStatus: 401,
        traceId,
        userId,
      });
      return;
    }

    if (error.statusCode === 401) {
      await traceRepository.markFailedTrace({
        failureCode: "backend_unauthorized",
        failureStage: "backend_auth",
        terminalHttpStatus: error.statusCode,
        traceId,
        userId,
      });
      return;
    }

    if (error.code === "flare_response_network_error") {
      await traceRepository.markFailedTrace({
        failureCode: "request_network_failed",
        failureStage: "request_transport",
        terminalHttpStatus: null,
        traceId,
        userId,
      });
    }
  } catch {
    return;
  }
}
