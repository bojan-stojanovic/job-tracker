import type { Application, Status } from "@/lib/validation/application";

export const STATUS_LABELS: Record<Status, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function formatSalary(app: Application) {
  if (app.salaryMin == null && app.salaryMax == null) return null;
  const fmt = new Intl.NumberFormat("en", {
    style: "currency",
    currency: app.currency,
    maximumFractionDigits: 0,
  });
  if (app.salaryMin != null && app.salaryMax != null) {
    return `${fmt.format(app.salaryMin)} – ${fmt.format(app.salaryMax)}`;
  }
  return fmt.format((app.salaryMin ?? app.salaryMax)!);
}