import type { ActiveFlarePlan, SavedFlarePlanAction } from "../services/flarePlanApi";
import type { FlarePlanRun } from "../services/flareResponseApi";

export const BUILT_IN_DEFAULT_FLARE_PLAN_ID = "built-in-default-flare-plan";

const BUILT_IN_DEFAULT_PLAN_ACTIONS = [
  {
    source_template_key: "move_to_different_room",
    title: "Move to a different room",
    description: "Create some distance from where the pattern was happening.",
  },
  {
    source_template_key: "drink_a_glass_of_water",
    title: "Drink a glass of water",
    description: "Give your body one simple physical reset.",
  },
  {
    source_template_key: "take_ten_slow_breaths",
    title: "Take ten slow breaths",
    description: "Slow the pace just enough to create a choice point.",
  },
  {
    source_template_key: "step_outside_for_two_minutes",
    title: "Step outside for two minutes",
    description: "Change your environment long enough to interrupt autopilot.",
  },
] as const;

function createIsoTimestamp() {
  return new Date().toISOString();
}

function createBuiltInDefaultPlanActions(): SavedFlarePlanAction[] {
  return BUILT_IN_DEFAULT_PLAN_ACTIONS.map((action, index) => ({
    id: `built-in-default-action-${index + 1}`,
    source_template_key: action.source_template_key,
    title: action.title,
    description: action.description,
    position: index + 1,
    is_active: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }));
}

export function createBuiltInDefaultPlan(): ActiveFlarePlan {
  const actions = createBuiltInDefaultPlanActions();

  return {
    id: BUILT_IN_DEFAULT_FLARE_PLAN_ID,
    is_configured: true,
    active_action_count: actions.length,
    maximum_active_actions: 10,
    actions,
    updated_at: new Date(0).toISOString(),
  };
}

export function createBuiltInDefaultRun(flareEventId: string): FlarePlanRun {
  const offeredAt = createIsoTimestamp();

  return {
    id: `built-in-default-run-${flareEventId}`,
    flare_event_id: flareEventId,
    source_plan_id: BUILT_IN_DEFAULT_FLARE_PLAN_ID,
    status: "offered",
    current_action: null,
    progress: {
      current_position: null,
      total_count: BUILT_IN_DEFAULT_PLAN_ACTIONS.length,
      done_count: 0,
      skipped_count: 0,
      not_reached_count: 0,
      pending_count: BUILT_IN_DEFAULT_PLAN_ACTIONS.length,
    },
    actions: createBuiltInDefaultPlanActions().map((action) => ({
      id: `built-in-default-event-action-${flareEventId}-${action.position}`,
      source_action_id: action.id,
      source_template_key: action.source_template_key,
      title: action.title,
      description: action.description,
      position: action.position,
      outcome: "pending",
      responded_at: null,
    })),
    offered_at: offeredAt,
    started_at: null,
    declined_at: null,
    completed_at: null,
    ended_at: null,
    updated_at: offeredAt,
  };
}

function buildProgress(run: FlarePlanRun) {
  const currentAction = run.actions.find((action) => action.outcome === "pending") ?? null;

  return {
    current_position: currentAction?.position ?? null,
    total_count: run.actions.length,
    done_count: run.actions.filter((action) => action.outcome === "done").length,
    skipped_count: run.actions.filter((action) => action.outcome === "skipped").length,
    not_reached_count: run.actions.filter((action) => action.outcome === "not_reached").length,
    pending_count: run.actions.filter((action) => action.outcome === "pending").length,
  };
}

function withUpdatedProgress(run: FlarePlanRun): FlarePlanRun {
  const progress = buildProgress(run);
  const currentAction = run.status === "in_progress"
    ? run.actions.find((action) => action.outcome === "pending") ?? null
    : null;

  return {
    ...run,
    current_action: currentAction,
    progress,
  };
}

export function isBuiltInDefaultRun(run: FlarePlanRun | null): boolean {
  return run?.source_plan_id === BUILT_IN_DEFAULT_FLARE_PLAN_ID;
}

export function beginBuiltInDefaultRun(run: FlarePlanRun): FlarePlanRun {
  const startedAt = createIsoTimestamp();

  return withUpdatedProgress({
    ...run,
    status: "in_progress",
    started_at: run.started_at ?? startedAt,
    updated_at: startedAt,
  });
}

export function declineBuiltInDefaultRun(run: FlarePlanRun): FlarePlanRun {
  const declinedAt = createIsoTimestamp();

  return withUpdatedProgress({
    ...run,
    status: "declined",
    actions: run.actions.map((action) =>
      action.outcome === "pending"
        ? { ...action, outcome: "not_reached", responded_at: action.responded_at ?? declinedAt }
        : action,
    ),
    declined_at: run.declined_at ?? declinedAt,
    updated_at: declinedAt,
  });
}

export function resolveBuiltInDefaultRunAction(
  run: FlarePlanRun,
  eventActionId: string,
  outcome: "done" | "skipped",
): FlarePlanRun {
  const respondedAt = createIsoTimestamp();
  const nextRun = {
    ...run,
    actions: run.actions.map((action) =>
      action.id === eventActionId
        ? { ...action, outcome, responded_at: respondedAt }
        : action,
    ),
    updated_at: respondedAt,
  };
  const hasPending = nextRun.actions.some((action) => action.outcome === "pending");

  return withUpdatedProgress({
    ...nextRun,
    status: hasPending ? "in_progress" : "completed",
    completed_at: hasPending ? null : nextRun.completed_at ?? respondedAt,
  });
}

export function endBuiltInDefaultRunEarly(run: FlarePlanRun): FlarePlanRun {
  const endedAt = createIsoTimestamp();

  return withUpdatedProgress({
    ...run,
    status: "ended_early",
    actions: run.actions.map((action) =>
      action.outcome === "pending"
        ? { ...action, outcome: "not_reached", responded_at: action.responded_at ?? endedAt }
        : action,
    ),
    ended_at: run.ended_at ?? endedAt,
    updated_at: endedAt,
  });
}
