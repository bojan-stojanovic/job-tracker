import { connection } from "next/server";
import { ApplicationForm } from "@/components/applications/application-form";
import { createApplication } from "@/lib/actions/applications";

export async function NewApplicationContent() {
  // Marks this render as per-request, so the date is computed when the page
  // is requested rather than frozen at build time.
  await connection();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ApplicationForm
      action={createApplication}
      defaultAppliedAt={today}
      submitLabel="Create application"
    />
  );
}