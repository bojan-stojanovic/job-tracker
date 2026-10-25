import {
  char,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const applicationStatus = pgEnum("application_status", [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
]);

export const interactionKind = pgEnum("interaction_kind", [
  "email",
  "call",
  "interview",
  "note",
]);

// user_id points at auth.users. The foreign key is added in
// supabase/rls.sql, because Drizzle doesn't manage Supabase's auth schema.
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    company: text("company").notNull(),
    roleTitle: text("role_title").notNull(),
    status: applicationStatus("status").notNull().default("applied"),
    position: integer("position").notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: char("currency", { length: 3 }).notNull().default("EUR"),
    jobUrl: text("job_url"),
    appliedAt: date("applied_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("applications_board_idx").on(t.userId, t.status, t.position),
  ],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    title: text("title"),
    linkedinUrl: text("linkedin_url"),
  },
  (t) => [index("contacts_application_idx").on(t.applicationId)],
);

export const interactions = pgTable(
  "interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    kind: interactionKind("kind").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    summary: text("summary").notNull(),
  },
  (t) => [index("interactions_application_idx").on(t.applicationId, t.occurredAt)],
);

// Written by the app on every status change. Analytics read from here, so
// the history stays accurate even if an application is later edited.
export const applicationStatusEvents = pgTable(
  "application_status_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    fromStatus: applicationStatus("from_status"),
    toStatus: applicationStatus("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("status_events_application_idx").on(t.applicationId, t.changedAt)],
);