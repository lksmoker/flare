import { FlareResponseApiError } from "../flareResponseApi";
import { sendSignedInFlareWithTrace } from "../sendFlareWithTrace";

jest.mock("../flareResponseApi", () => ({
  ...jest.requireActual("../flareResponseApi"),
  createFlareResponse: jest.fn(),
}));

describe("sendSignedInFlareWithTrace", () => {
  const createFlareResponse =
    jest.requireMock("../flareResponseApi").createFlareResponse as jest.Mock;

  afterEach(() => {
    createFlareResponse.mockReset();
  });

  it("writes the initiated trace and reuses it as the create idempotency key", async () => {
    const traceRepository = {
      createInitiatedTrace: jest.fn().mockResolvedValue(undefined),
      markFailedTrace: jest.fn().mockResolvedValue(undefined),
    };
    createFlareResponse.mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-17T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-17T00:00:00Z",
        userId: "user-1",
      },
      run: null,
    });

    const result = await sendSignedInFlareWithTrace(
      {
        behaviorLabelSnapshot: "Scrolling",
        responseMode: "configured",
        userId: "user-1",
      },
      {
        createTraceId: () => "trace-1",
        traceRepository,
      },
    );

    expect(result.traceId).toBe("trace-1");
    expect(traceRepository.createInitiatedTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        responseMode: "configured",
        traceId: "trace-1",
        userId: "user-1",
      }),
    );
    expect(createFlareResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        behaviorLabelSnapshot: "Scrolling",
        idempotencyKey: "trace-1",
      }),
      undefined,
    );
  });

  it("records a backend authentication rejection through the owner-scoped trace row", async () => {
    const traceRepository = {
      createInitiatedTrace: jest.fn().mockResolvedValue(undefined),
      markFailedTrace: jest.fn().mockResolvedValue(undefined),
    };
    createFlareResponse.mockRejectedValue(
      new FlareResponseApiError({
        code: "unauthorized",
        message: "Authentication is required.",
        statusCode: 401,
      }),
    );

    await expect(
      sendSignedInFlareWithTrace(
        {
          behaviorLabelSnapshot: "Scrolling",
          responseMode: "configured",
          userId: "user-1",
        },
        {
          createTraceId: () => "trace-1",
          traceRepository,
        },
      ),
    ).rejects.toMatchObject({
      code: "unauthorized",
      retryTraceId: "trace-1",
      statusCode: 401,
    });

    expect(traceRepository.markFailedTrace).toHaveBeenCalledWith({
      failureCode: "backend_unauthorized",
      failureStage: "backend_auth",
      terminalHttpStatus: 401,
      traceId: "trace-1",
      userId: "user-1",
    });
  });

  it("records a definite client-observed request transport failure", async () => {
    const traceRepository = {
      createInitiatedTrace: jest.fn().mockResolvedValue(undefined),
      markFailedTrace: jest.fn().mockResolvedValue(undefined),
    };
    createFlareResponse.mockRejectedValue(
      new FlareResponseApiError({
        code: "flare_response_network_error",
        message: "Flare Response could not reach the server right now.",
        statusCode: 0,
      }),
    );

    await expect(
      sendSignedInFlareWithTrace(
        {
          behaviorLabelSnapshot: "Scrolling",
          responseMode: "configured",
          userId: "user-1",
        },
        {
          createTraceId: () => "trace-1",
          traceRepository,
        },
      ),
    ).rejects.toMatchObject({
      code: "flare_response_network_error",
      retryTraceId: "trace-1",
    });

    expect(traceRepository.markFailedTrace).toHaveBeenCalledWith({
      failureCode: "request_network_failed",
      failureStage: "request_transport",
      terminalHttpStatus: null,
      traceId: "trace-1",
      userId: "user-1",
    });
  });

  it("reuses the existing trace id for a retry of the same logical attempt", async () => {
    const traceRepository = {
      createInitiatedTrace: jest.fn().mockResolvedValue(undefined),
      markFailedTrace: jest.fn().mockResolvedValue(undefined),
    };
    createFlareResponse.mockResolvedValue({
      flareEvent: {
        anchorNoteId: null,
        anchorNoteVersion: null,
        archivedAt: null,
        behaviorDescriptionSnapshot: null,
        behaviorLabelSnapshot: "Scrolling",
        behaviorPatternId: null,
        checkpoint: null,
        closedAt: null,
        createdAt: "2026-07-17T00:00:00Z",
        id: "event-1",
        responseMode: "configured",
        status: "active",
        supportActionShown: null,
        supportActionTaken: null,
        updatedAt: "2026-07-17T00:00:00Z",
        userId: "user-1",
      },
      run: null,
    });

    await sendSignedInFlareWithTrace(
      {
        behaviorLabelSnapshot: "Scrolling",
        existingTraceId: "trace-1",
        responseMode: "configured",
        userId: "user-1",
      },
      {
        createTraceId: () => "trace-2",
        traceRepository,
      },
    );

    expect(createFlareResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "trace-1",
      }),
      undefined,
    );
  });
});
