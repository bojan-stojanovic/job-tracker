"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { parseCsv, CSV_COLUMNS } from "@/lib/csv/csv";
import { repository } from "@/lib/repository";
import {
  applicationInputSchema,
  type NewApplication,
} from "@/lib/validation/application";

export type ImportState = {
  ok: boolean;
  message?: string;
  rowErrors?: { row: number; message: string }[];
};

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 500;
const REQUIRED_COLUMNS = ["company", "roleTitle", "appliedAt"];

// Turns one CSV row into the shape the schema expects.
function toInput(cells: string[], columns: Record<string, number>) {
  const get = (key: string) => {
    const i = columns[key];
    const raw = i === undefined ? "" : (cells[i] ?? "").trim();
    return raw.replace(/^'(?=[=+\-@])/, "");
  };
  const num = (key: string) => {
    const v = get(key);
    return v === "" ? null : Number(v);
  };

  return {
    company: get("company"),
    roleTitle: get("roleTitle"),
    salaryMin: num("salaryMin"),
    salaryMax: num("salaryMax"),
    currency: get("currency") || undefined,
    jobUrl: get("jobUrl") || null,
    appliedAt: get("appliedAt"),
  };
}

export async function importApplications(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV file." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "The file is larger than 1 MB." };
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return { ok: false, message: "The file needs a header row and at least one application." };
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return { ok: false, message: `Import up to ${MAX_ROWS} rows at a time.` };
  }

  const columns = Object.fromEntries(
    rows[0].map((header, i) => [header.trim(), i]),
  );
  const missing = REQUIRED_COLUMNS.filter((c) => !(c in columns));
  if (missing.length) {
    return { ok: false, message: `Missing columns: ${missing.join(", ")}.` };
  }

  // Validate every row first. If any row fails, nothing is written.
  const valid: NewApplication[] = [];
  const rowErrors: { row: number; message: string }[] = [];

  dataRows.forEach((cells, i) => {
    const parsed = applicationInputSchema.safeParse(toInput(cells, columns));
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      rowErrors.push({
        // Row 1 is the header, so data row i is line i + 2 in the file.
        row: i + 2,
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
    }
  });

  if (rowErrors.length > 0) {
    return {
      ok: false,
      message: "Nothing was imported. Fix the rows below and upload the file again.",
      rowErrors,
    };
  }

  const userId = await getCurrentUserId();
  try {
    await repository.createMany(userId, valid);
  } catch {
    return { ok: false, message: "The import failed and nothing was saved. Try again." };
  }

  revalidatePath("/board");
  revalidatePath("/analytics");
  return { ok: true, message: `Imported ${valid.length} applications.` };
}