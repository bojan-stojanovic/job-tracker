"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { repository } from "@/lib/repository";
import type { FormState } from "@/lib/actions/activity";
import {
  applicationInputSchema,
  statusSchema,
} from "@/lib/validation/application";

const moveSchema = z.object({
  id: z.string().min(1),
  status: statusSchema,
  position: z.number().int(),
});

export async function moveApplication(input: z.infer<typeof moveSchema>) {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid move");

  const userId = await getCurrentUserId();
  await repository.move(userId, parsed.data.id, parsed.data.status, parsed.data.position);
  revalidatePath("/board");
}

// Form fields arrive as strings. Convert them before the schema runs.
// Non-exported helpers are fine in a "use server" file.
function fromForm(formData: FormData) {
  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v.trim() : "";
  };
  const optionalNumber = (key: string) => {
    const v = text(key);
    return v === "" ? null : Number(v);
  };

  return {
    company: text("company"),
    roleTitle: text("roleTitle"),
    salaryMin: optionalNumber("salaryMin"),
    salaryMax: optionalNumber("salaryMax"),
    currency: text("currency") || "EUR",
    jobUrl: text("jobUrl") || null,
    appliedAt: text("appliedAt"),
  };
}

export async function createApplication(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Status is omitted, so the schema default ("applied") is used.
  const parsed = applicationInputSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  let id: string;
  try {
    const app = await repository.create(userId, parsed.data);
    id = app.id;
  } catch {
    return { ok: false, message: "Couldn't save the application. Try again." };
  }

  revalidatePath("/board");
  redirect(`/applications/${id}`);
}

export async function updateApplication(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const idCheck = z.uuid().safeParse(id);
  if (!idCheck.success) return { ok: false, message: "Invalid application." };

  const parsed = applicationInputSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Status changes go through moveApplication so they are logged.
  const { status: _ignored, ...fields } = parsed.data;

  const userId = await getCurrentUserId();
  try {
    await repository.update(userId, idCheck.data, fields);
  } catch {
    return { ok: false, message: "Couldn't save changes. Try again." };
  }

  revalidatePath("/board");
  revalidatePath(`/applications/${idCheck.data}`);
  redirect(`/applications/${idCheck.data}`);
}