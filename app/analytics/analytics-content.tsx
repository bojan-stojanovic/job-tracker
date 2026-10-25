import Link from "next/link";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { computeAnalytics } from "@/lib/analytics/compute";
import { getCurrentUserId } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/format";
import { repository, statusEventRepository } from "@/lib/repository";

export async function AnalyticsContent() {
  const userId = await getCurrentUserId();
  const [apps, events] = await Promise.all([
    repository.list(userId),
    statusEventRepository.listForUser(userId),
  ]);

  if (apps.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">No data yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
          Analytics appear once you have applications. Add one, or import a CSV
          file.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/applications/new"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
          >
            New application
          </Link>
          <Link
            href="/import-export"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Import CSV
          </Link>
        </div>
      </div>
    );
  }

  const summary = computeAnalytics(apps, events);

  const rate =
    summary.responseRate == null ? "—" : `${Math.round(summary.responseRate * 100)}%`;
  const median =
    summary.medianDaysToInterview == null
      ? "—"
      : `${summary.medianDaysToInterview} days`;

  const chartData = summary.funnel.map((f) => ({
    name: STATUS_LABELS[f.status],
    count: f.count,
  }));

  return (
    <>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Applications" value={String(summary.total)} />
        <Stat
          label="Response rate"
          value={rate}
          hint={summary.responseRate == null ? "Needs at least one application that isn't withdrawn." : undefined}
        />
        <Stat
          label="Median days to first interview"
          value={median}
          hint={summary.medianDaysToInterview == null ? "No interviews recorded yet." : undefined}
        />
      </dl>

      <section aria-labelledby="funnel-heading" className="mt-8">
        <h2 id="funnel-heading" className="mb-3 text-lg font-semibold">
          Pipeline funnel
        </h2>
        <FunnelChart data={chartData} />
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <dt className="text-sm text-neutral-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
      {hint && <p className="mt-2 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}