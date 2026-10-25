import type { Status } from "@/lib/validation/application";

export type StatusEvent = {
  id: string;
  userId: string;
  applicationId: string;
  fromStatus: Status | null;
  toStatus: Status;
  changedAt: string;
};

export type AnalyticsSummary = {
  total: number;
  responseRate: number | null;
  medianDaysToInterview: number | null;
  funnel: { status: Status; count: number }[];
};