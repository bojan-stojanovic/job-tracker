import type { Application } from "@/lib/validation/application";

// Status is left out on purpose. Imported rows always start in Applied,
// which matches the form and keeps the status history accurate.
export const CSV_COLUMNS = [
  "company",
  "roleTitle",
  "salaryMin",
  "salaryMax",
  "currency",
  "jobUrl",
  "appliedAt",
] as const;

function escapeCell(value: unknown): string {
  if (value == null) return "";
  let s = String(value);
  // Stop spreadsheet apps from running formulas found in imported text.
  // The importer strips this prefix again.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function applicationsToCsv(apps: Application[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const app of apps) {
    lines.push(CSV_COLUMNS.map((col) => escapeCell(app[col])).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

// Handles quoted fields, escaped quotes, and CRLF or LF line endings.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}