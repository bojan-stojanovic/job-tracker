import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/applications/application-form";
import { updateApplication } from "@/lib/actions/applications";
import { getCurrentUserId } from "@/lib/auth";
import { repository } from "@/lib/repository";

export async function EditApplicationContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const app = await repository.get(userId, id);
  if (!app) notFound();

  // Binding the ID gives the form an action with the (prev, formData) signature.
  const action = updateApplication.bind(null, app.id);

  return (
    <>
      <Link href={`/applications/${app.id}`} className="text-sm text-neutral-600 underline">
        ← Back to application
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-semibold">Edit application</h1>
      <ApplicationForm action={action} defaultValues={app} submitLabel="Save changes" />
    </>
  );
}