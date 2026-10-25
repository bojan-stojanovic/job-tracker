import { z } from "zod";

// Empty form fields arrive as "" or null. Treat both as "not provided".
const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.preprocess(emptyToUndefined, z.email({ error: "Enter a valid email" }).optional()),
  title: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
});

export type NewContact = z.infer<typeof contactInputSchema>;

export type Contact = NewContact & {
  id: string;
  userId: string;
  applicationId: string;
};