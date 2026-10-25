import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { activityRepository, repository } from "@/lib/repository";
import { STATUS_LABELS, formatSalary } from "@/lib/format";
import {
  AddContactForm,
  AddInteractionForm,
} from "@/components/activity/activity-forms";
import Link from "next/link";

export async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [app, contacts, interactions] = await Promise.all([
    repository.get(userId, id),
    activityRepository.listContacts(userId, id),
    activityRepository.listInteractions(userId, id),
  ]);

  if (!app) notFound();

  const salary = formatSalary(app);

  return (
    <article className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-8">
        <header>
          <p className="text-sm text-neutral-500">
            {STATUS_LABELS[app.status]} · applied {app.appliedAt}
          </p>
          <h1 className="text-2xl font-semibold">{app.roleTitle}</h1>
          <p className="text-neutral-600">{app.company}</p>
          {salary && <p className="mt-1 text-sm text-neutral-500">{salary}</p>}
          {app.jobUrl && (
            <a
              href={app.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm underline"
            >
              View job posting
            </a>

          )}
          <Link
            href={`/applications/${app.id}/edit`}
            className="mt-3 inline-block text-sm underline"
          >
            Edit application
          </Link>
        </header>

        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="mb-3 text-lg font-semibold">
            Timeline
          </h2>
          <AddInteractionForm applicationId={app.id} />

          {interactions.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No interactions yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {interactions.map((i) => (
                <li key={i.id} className="border-l-2 border-neutral-300 pl-4">
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium capitalize text-neutral-700">{i.kind}</span>
                    {" · "}
                    {new Date(i.occurredAt).toLocaleString("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm">{i.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <aside aria-labelledby="contacts-heading">
        <h2 id="contacts-heading" className="mb-3 text-lg font-semibold">
          Contacts
        </h2>
        {contacts.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">No contacts yet.</p>
        ) : (
          <ul className="mb-4 space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className="rounded-md bg-white p-3 shadow-sm">
                <p className="font-medium">{c.name}</p>
                {c.title && <p className="text-sm text-neutral-600">{c.title}</p>}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-sm underline">
                    {c.email}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <AddContactForm applicationId={app.id} />
      </aside>
    </article>
  );
}