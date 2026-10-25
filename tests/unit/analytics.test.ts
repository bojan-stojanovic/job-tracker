import { describe, expect, it } from "vitest";
import { computeAnalytics, median } from "@/lib/analytics/compute";
import type { Application } from "@/lib/validation/application";
import type { StatusEvent } from "@/lib/analytics/types";

function app(id: string, overrides: Partial<Application> = {}): Application {
  return {
    id,
    userId: "u1",
    company: "Acme",
    roleTitle: "Engineer",
    status: "applied",
    position: 1000,
    salaryMin: null,
    salaryMax: null,
    currency: "EUR",
    jobUrl: null,
    appliedAt: "2026-10-01",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

function event(
  applicationId: string,
  toStatus: StatusEvent["toStatus"],
  changedAt: string,
): StatusEvent {
  return {
    id: `${applicationId}-${toStatus}-${changedAt}`,
    userId: "u1",
    applicationId,
    fromStatus: null,
    toStatus,
    changedAt,
  };
}

describe("median", () => {
  it("returns null for an empty list", () => {
    expect(median([])).toBeNull();
  });

  it("returns the middle value for an odd count", () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it("averages the two middle values for an even count", () => {
    expect(median([1, 2, 3, 10])).toBe(2.5);
  });
});

describe("computeAnalytics", () => {
  it("returns null rates and median when there is no data", () => {
    const result = computeAnalytics([], []);
    expect(result.total).toBe(0);
    expect(result.responseRate).toBeNull();
    expect(result.medianDaysToInterview).toBeNull();
  });

  it("counts an application as responded when it reaches interviewing, offer, or rejected", () => {
    const apps = [
      app("a", { status: "interviewing" }),
      app("b", { status: "rejected" }),
      app("c", { status: "applied" }),
      app("d", { status: "applied" }),
    ];
    const events = [
      event("a", "interviewing", "2026-10-05T00:00:00Z"),
      event("b", "rejected", "2026-10-08T00:00:00Z"),
    ];
    expect(computeAnalytics(apps, events).responseRate).toBe(0.5);
  });

  it("leaves withdrawn applications out of the response-rate denominator", () => {
    const apps = [
      app("a", { status: "interviewing" }),
      app("b", { status: "applied" }),
      app("c", { status: "withdrawn" }),
    ];
    const events = [event("a", "interviewing", "2026-10-05T00:00:00Z")];
    // 1 responded out of 2 eligible (withdrawn excluded), not 1 out of 3.
    expect(computeAnalytics(apps, events).responseRate).toBe(0.5);
  });

  it("measures days from applied date to the first interviewing event", () => {
    const apps = [app("a", { status: "interviewing", appliedAt: "2026-10-01" })];
    const events = [event("a", "interviewing", "2026-10-11T00:00:00Z")];
    expect(computeAnalytics(apps, events).medianDaysToInterview).toBe(10);
  });

  it("uses only the first interviewing event, not later ones", () => {
    const apps = [app("a", { status: "interviewing", appliedAt: "2026-10-01" })];
    const events = [
      event("a", "interviewing", "2026-10-04T00:00:00Z"),
      event("a", "interviewing", "2026-10-20T00:00:00Z"),
    ];
    expect(computeAnalytics(apps, events).medianDaysToInterview).toBe(3);
  });

  it("ignores events for applications the user does not have", () => {
    const apps = [app("a", { status: "applied" })];
    const events = [event("ghost", "interviewing", "2026-10-05T00:00:00Z")];
    const result = computeAnalytics(apps, events);
    expect(result.responseRate).toBe(0);
    expect(result.medianDaysToInterview).toBeNull();
  });

  it("builds the funnel with every status, including zero counts", () => {
    const apps = [app("a", { status: "offer" }), app("b", { status: "offer" })];
    const funnel = computeAnalytics(apps, []).funnel;
    expect(funnel.map((f) => f.status)).toEqual([
      "applied",
      "interviewing",
      "offer",
      "rejected",
      "withdrawn",
    ]);
    expect(funnel.find((f) => f.status === "offer")?.count).toBe(2);
    expect(funnel.find((f) => f.status === "applied")?.count).toBe(0);
  });
});