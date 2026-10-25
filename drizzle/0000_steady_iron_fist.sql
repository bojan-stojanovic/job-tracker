CREATE TYPE "public"."application_status" AS ENUM('applied', 'interviewing', 'offer', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."interaction_kind" AS ENUM('email', 'call', 'interview', 'note');--> statement-breakpoint
CREATE TABLE "application_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company" text NOT NULL,
	"role_title" text NOT NULL,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"position" integer NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"currency" char(3) DEFAULT 'EUR' NOT NULL,
	"job_url" text,
	"applied_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"title" text,
	"linkedin_url" text
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "interaction_kind" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_status_events" ADD CONSTRAINT "application_status_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "status_events_application_idx" ON "application_status_events" USING btree ("application_id","changed_at");--> statement-breakpoint
CREATE INDEX "applications_board_idx" ON "applications" USING btree ("user_id","status","position");--> statement-breakpoint
CREATE INDEX "contacts_application_idx" ON "contacts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "interactions_application_idx" ON "interactions" USING btree ("application_id","occurred_at");