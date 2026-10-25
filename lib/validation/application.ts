import { z } from "zod";

export const STATUSES = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export const statusSchema = z.enum(STATUSES);
export type Status = z.infer<typeof statusSchema>;

const optionalSalary = z
  .number({ error: "Enter a whole number" })
  .int()
  .nonnegative()
  .nullable();

export const applicationInputSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(120),
    roleTitle: z.string().trim().min(1, "Role is required").max(120),
    status: statusSchema.default("applied"),
    salaryMin: optionalSalary,
    salaryMax: optionalSalary,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, "Use a 3-letter currency code")
      .default("EUR"),
    jobUrl: z.url({ error: "Enter a valid URL" }).nullable(),
    appliedAt: z.iso.date({ error: "Use the format YYYY-MM-DD" }),
  })
  .refine(
    (d) => d.salaryMin == null || d.salaryMax == null || d.salaryMin <= d.salaryMax,
    { message: "Maximum salary must be at least the minimum", path: ["salaryMax"] },
  );

export type NewApplication = z.infer<typeof applicationInputSchema>;

export type Application = NewApplication & {
  id: string;
  userId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};