import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  applicationStatusEvents,
  contacts,
  interactions,
} from "@/lib/db/schema";

const userId = process.argv[2];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!userId || !UUID.test(userId)) {
  console.error(
    "Usage: bun --env-file=.env.local scripts/seed-demo.ts <user-uuid>",
  );
  process.exit(1);
}

// Refuse to run twice, so demo data can't pile up for the same user.
const existing = await db
  .select({ id: applications.id })
  .from(applications)
  .where(eq(applications.userId, userId))
  .limit(1);

if (existing.length > 0) {
  console.error("This user already has applications. Seed skipped.");
  process.exit(1);
}

type Demo = {
  company: string;
  roleTitle: string;
  status: "applied" | "interviewing" | "offer" | "rejected" | "withdrawn";
  salaryMin: number | null;
  salaryMax: number | null;
  appliedAt: string;
  // Days after applying when the status moved on from "applied".
  moveAfterDays: number;
  contact?: { name: string; email?: string; title?: string };
  notes?: { kind: "email" | "call" | "interview" | "note"; day: number; summary: string }[];
};

const demo: Demo[] = [
  { company: "Acme Analytics", roleTitle: "Senior Frontend Engineer", status: "applied", salaryMin: 70000, salaryMax: 85000, appliedAt: "2026-10-01", moveAfterDays: 0 },
  { company: "Northwind Labs", roleTitle: "Frontend Lead", status: "applied", salaryMin: null, salaryMax: 95000, appliedAt: "2026-10-05", moveAfterDays: 0 },
  { company: "Globex", roleTitle: "React Engineer", status: "applied", salaryMin: 60000, salaryMax: 72000, appliedAt: "2026-10-09", moveAfterDays: 0 },
  {
    company: "Initech", roleTitle: "Vue Developer", status: "interviewing", salaryMin: 65000, salaryMax: 78000, appliedAt: "2026-09-18", moveAfterDays: 4,
    contact: { name: "Tom Becker", email: "tom@example.com", title: "Recruiter" },
    notes: [
      { kind: "call", day: 4, summary: "Recruiter screen. Discussed React and Vue experience." },
      { kind: "interview", day: 12, summary: "Technical round on component design." },
    ],
  },
  {
    company: "Umbrella Tech", roleTitle: "Frontend Engineer", status: "interviewing", salaryMin: 75000, salaryMax: 90000, appliedAt: "2026-09-25", moveAfterDays: 6,
    contact: { name: "Priya Nair", title: "Tech Lead" },
    notes: [{ kind: "interview", day: 6, summary: "Pair-programming session on a dashboard." }],
  },
  {
    company: "Stark Industries", roleTitle: "Senior UI Engineer", status: "offer", salaryMin: 80000, salaryMax: 92000, appliedAt: "2026-09-10", moveAfterDays: 5,
    contact: { name: "Jordan Kim", email: "jordan@example.com", title: "Hiring Manager" },
    notes: [{ kind: "note", day: 14, summary: "Offer received. Asked for a week to decide." }],
  },
  { company: "Wayne Systems", roleTitle: "Frontend Developer", status: "rejected", salaryMin: 55000, salaryMax: 62000, appliedAt: "2026-08-30", moveAfterDays: 14 },
  { company: "Cyberdyne", roleTitle: "Web Engineer", status: "rejected", salaryMin: null, salaryMax: null, appliedAt: "2026-09-02", moveAfterDays: 14 },
  { company: "Soylent", roleTitle: "Frontend Engineer", status: "withdrawn", salaryMin: 60000, salaryMax: 70000, appliedAt: "2026-08-20", moveAfterDays: 10 },
];

const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T09:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const positionByStatus: Record<string, number> = {};

for (const item of demo) {
  positionByStatus[item.status] = (positionByStatus[item.status] ?? 0) + 1;

  const [app] = await db
    .insert(applications)
    .values({
      userId,
      company: item.company,
      roleTitle: item.roleTitle,
      status: item.status,
      position: positionByStatus[item.status] * 1000,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      currency: "EUR",
      jobUrl: null,
      appliedAt: item.appliedAt,
    })
    .returning();

  // Status history: every application starts as applied, then moves on.
  await db.insert(applicationStatusEvents).values({
    applicationId: app.id,
    userId,
    fromStatus: null,
    toStatus: "applied",
    changedAt: addDays(item.appliedAt, 0),
  });

  if (item.status !== "applied") {
    await db.insert(applicationStatusEvents).values({
      applicationId: app.id,
      userId,
      fromStatus: "applied",
      toStatus: item.status,
      changedAt: addDays(item.appliedAt, item.moveAfterDays),
    });
  }

  if (item.contact) {
    await db.insert(contacts).values({
      applicationId: app.id,
      userId,
      name: item.contact.name,
      email: item.contact.email ?? null,
      title: item.contact.title ?? null,
    });
  }

  for (const note of item.notes ?? []) {
    await db.insert(interactions).values({
      applicationId: app.id,
      userId,
      kind: note.kind,
      occurredAt: addDays(item.appliedAt, note.day),
      summary: note.summary,
    });
  }
}

console.log(`Seeded ${demo.length} applications for ${userId}.`);
process.exit(0);