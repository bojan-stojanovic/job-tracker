import { STATUSES, type Application } from "@/lib/validation/application";
import type { AnalyticsSummary, StatusEvent } from "./types";

const DAY_MS = 86_400_000;
const RESPONSE_STATUSES = new Set(["interviewing", "offer", "rejected"]);

export function computeAnalytics(
  apps: Application[],
  events: StatusEvent[],
): AnalyticsSummary {
  // Withdrawn applications ended on the candidate's side, so they're left
  // out of the response-rate denominator.
  const eligible = apps.filter((a) => a.status !== "withdrawn");
  const eligibleIds = new Set(eligible.map((a) => a.id));
  const appsById = new Map(apps.map((a) => [a.id, a]));

  const responded = new Set<string>();
  const firstInterviewAt = new Map<string, number>();

  const ordered = [...events].sort((a, b) => a.changedAt.localeCompare(b.changedAt));
  for (const e of ordered) {
    if (eligibleIds.has(e.applicationId) && RESPONSE_STATUSES.has(e.toStatus)) {
      responded.add(e.applicationId);
    }
    if (e.toStatus === "interviewing" && !firstInterviewAt.has(e.applicationId)) {
      firstInterviewAt.set(e.applicationId, Date.parse(e.changedAt));
    }
  }

  const days: number[] = [];
  for (const [appId, changedMs] of firstInterviewAt) {
    const app = appsById.get(appId);
    if (!app) continue;
    const appliedMs = Date.parse(`${app.appliedAt}T00:00:00Z`);
    days.push(Math.round((changedMs - appliedMs) / DAY_MS));
  }

  return {
    total: apps.length,
    responseRate: eligible.length ? responded.size / eligible.length : null,
    medianDaysToInterview: median(days),
    funnel: STATUSES.map((status) => ({
      status,
      count: apps.filter((a) => a.status === status).length,
    })),
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}