"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { activityRepository } from "@/lib/repository";
import { contactInputSchema } from "@/lib/validation/contact";
import { interactionInputSchema } from "@/lib/validation/interaction";

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const idSchema = z.uuid();

export async function addContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = idSchema.safeParse(formData.get("applicationId"));
  if (!id.success) return { ok: false, message: "Invalid application." };

  const parsed = contactInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  try {
    await activityRepository.addContact(userId, id.data, parsed.data);
  } catch {
    return { ok: false, message: "Couldn't save the contact. Try again." };
  }

  revalidatePath(`/applications/${id.data}`);
  return { ok: true };
}

export async function addInteraction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = idSchema.safeParse(formData.get("applicationId"));
  if (!id.success) return { ok: false, message: "Invalid application." };

  const parsed = interactionInputSchema.safeParse({
    kind: formData.get("kind"),
    occurredAt: formData.get("occurredAt"),
    summary: formData.get("summary"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  try {
    await activityRepository.addInteraction(userId, id.data, parsed.data);
  } catch {
    return { ok: false, message: "Couldn't save the interaction. Try again." };
  }

  revalidatePath(`/applications/${id.data}`);
  return { ok: true };
}