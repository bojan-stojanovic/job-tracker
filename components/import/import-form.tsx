"use client";

import { useActionState } from "react";
import { importApplications, type ImportState } from "@/lib/actions/import";

const initial: ImportState = { ok: false };

export function ImportForm() {
  const [state, action, pending] = useActionState(importApplications, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="csv-file" className="block text-sm font-medium">
          CSV file
        </label>
        <input
          id="csv-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="mt-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Importing…" : "Import"}
      </button>

      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      )}

      {state.rowErrors && state.rowErrors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold">Row errors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {state.rowErrors.map((e) => (
              <li key={e.row}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}