import { z } from "zod";

export const INTERACTION_KINDS = ["email", "call", "interview", "note"] as const;

export const interactionInputSchema = z.object({
  kind: z.enum(INTERACTION_KINDS),
  occurredAt: z
    .string()
    .min(1, "Pick a date and time")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date and time")
    .transform((v) => new Date(v).toISOString()),
  summary: z.string().trim().min(1, "Summary is required").max(500),
});

export type NewInteraction = z.infer<typeof interactionInputSchema>;

export type Interaction = NewInteraction & {
  id: string;
  userId: string;
  applicationId: string;
};