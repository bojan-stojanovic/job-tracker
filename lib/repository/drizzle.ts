import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  applicationStatusEvents,
  contacts,
  interactions,
} from "@/lib/db/schema";
import type {
  ActivityRepository,
  ApplicationRepository,
  StatusEventRepository,
} from "./types";
import type {
  Application,
  NewApplication,
  Status,
} from "@/lib/validation/application";
import type { Contact, NewContact } from "@/lib/validation/contact";
import type { Interaction, NewInteraction } from "@/lib/validation/interaction";
import type { StatusEvent } from "@/lib/analytics/types";

const STEP = 1000;

type AppRow = typeof applications.$inferSelect;

function toApplication(row: AppRow): Application {
  return {
    id: row.id,
    userId: row.userId,
    company: row.company,
    roleTitle: row.roleTitle,
    status: row.status,
    position: row.position,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    jobUrl: row.jobUrl,
    appliedAt: row.appliedAt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Ownership check used before writes to child tables.
async function assertOwnedApplication(userId: string, applicationId: string) {
  const [row] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(eq(applications.id, applicationId), eq(applications.userId, userId)),
    )
    .limit(1);
  if (!row) throw new Error("Application not found");
}

// Next position at the end of a column: max + gap, or the first slot if empty.
async function nextPositionIn(
  executor: typeof db,
  userId: string,
  status: Status,
) {
  const [row] = await executor
    .select({
      max: sql<number>`coalesce(max(${applications.position}), 0)`,
    })
    .from(applications)
    .where(
      and(eq(applications.userId, userId), eq(applications.status, status)),
    );
  return Number(row.max) + STEP;
}

export const drizzleApplicationRepository: ApplicationRepository = {
  async list(userId) {
    const rows = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(asc(applications.position));
    return rows.map(toApplication);
  },

  async get(userId, id) {
    const [row] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);
    return row ? toApplication(row) : null;
  },

  async create(userId, input) {
    return db.transaction(async (tx) => {
      const position = await nextPositionIn(
        tx as unknown as typeof db,
        userId,
        input.status,
      );
      const [row] = await tx
        .insert(applications)
        .values({ ...input, userId, position })
        .returning();

      await tx.insert(applicationStatusEvents).values({
        applicationId: row.id,
        userId,
        fromStatus: null,
        toStatus: row.status,
      });

      return toApplication(row);
    });
  },

  // One transaction for the whole batch, so a failure imports nothing.
  async createMany(userId, inputs) {
    return db.transaction(async (tx) => {
      const start = await nextPositionIn(
        tx as unknown as typeof db,
        userId,
        "applied",
      );
      const rows = await tx
        .insert(applications)
        .values(
          inputs.map((input, i) => ({
            ...input,
            userId,
            position: start + i * STEP,
          })),
        )
        .returning();

      await tx.insert(applicationStatusEvents).values(
        rows.map((row) => ({
          applicationId: row.id,
          userId,
          fromStatus: null,
          toStatus: row.status,
        })),
      );

      return rows.map(toApplication);
    });
  },

  async update(userId, id, input) {
    const [row] = await db
      .update(applications)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();
    if (!row) throw new Error("Application not found");
    return toApplication(row);
  },

  async move(userId, id, status, position) {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ status: applications.status })
        .from(applications)
        .where(and(eq(applications.id, id), eq(applications.userId, userId)))
        .limit(1);
      if (!current) throw new Error("Application not found");

      if (current.status !== status) {
        await tx.insert(applicationStatusEvents).values({
          applicationId: id,
          userId,
          fromStatus: current.status,
          toStatus: status,
        });
      }

      await tx
        .update(applications)
        .set({ status, position, updatedAt: new Date() })
        .where(and(eq(applications.id, id), eq(applications.userId, userId)));
    });
  },

  async remove(userId, id) {
    const deleted = await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning({ id: applications.id });
    if (deleted.length === 0) throw new Error("Application not found");
  },
};

export const drizzleActivityRepository: ActivityRepository = {
  async listContacts(userId, applicationId) {
    const rows = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          eq(contacts.applicationId, applicationId),
        ),
      );
    return rows.map(
      (r): Contact => ({
        id: r.id,
        userId: r.userId,
        applicationId: r.applicationId,
        name: r.name,
        email: r.email ?? undefined,
        title: r.title ?? undefined,
      }),
    );
  },

  async addContact(userId, applicationId, input: NewContact) {
    await assertOwnedApplication(userId, applicationId);
    const [r] = await db
      .insert(contacts)
      .values({
        applicationId,
        userId,
        name: input.name,
        email: input.email ?? null,
        title: input.title ?? null,
      })
      .returning();
    return {
      id: r.id,
      userId: r.userId,
      applicationId: r.applicationId,
      name: r.name,
      email: r.email ?? undefined,
      title: r.title ?? undefined,
    };
  },

  async listInteractions(userId, applicationId) {
    const rows = await db
      .select()
      .from(interactions)
      .where(
        and(
          eq(interactions.userId, userId),
          eq(interactions.applicationId, applicationId),
        ),
      )
      .orderBy(desc(interactions.occurredAt));
    return rows.map(
      (r): Interaction => ({
        id: r.id,
        userId: r.userId,
        applicationId: r.applicationId,
        kind: r.kind,
        occurredAt: r.occurredAt.toISOString(),
        summary: r.summary,
      }),
    );
  },

  async addInteraction(userId, applicationId, input: NewInteraction) {
    await assertOwnedApplication(userId, applicationId);
    const [r] = await db
      .insert(interactions)
      .values({
        applicationId,
        userId,
        kind: input.kind,
        occurredAt: new Date(input.occurredAt),
        summary: input.summary,
      })
      .returning();
    return {
      id: r.id,
      userId: r.userId,
      applicationId: r.applicationId,
      kind: r.kind,
      occurredAt: r.occurredAt.toISOString(),
      summary: r.summary,
    };
  },
};

export const drizzleStatusEventRepository: StatusEventRepository = {
  async listForUser(userId) {
    const rows = await db
      .select()
      .from(applicationStatusEvents)
      .where(eq(applicationStatusEvents.userId, userId));
    return rows.map(
      (r): StatusEvent => ({
        id: r.id,
        userId: r.userId,
        applicationId: r.applicationId,
        fromStatus: r.fromStatus,
        toStatus: r.toStatus,
        changedAt: r.changedAt.toISOString(),
      }),
    );
  },
};