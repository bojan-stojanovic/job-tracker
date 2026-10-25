import { ImportForm } from "@/components/import/import-form";

export default function ImportExportPage() {
  return (
    <main className="p-8">
      <div className="max-w-2xl space-y-10">
        <h1 className="text-2xl font-semibold">Import and export</h1>

        <section aria-labelledby="export-heading" className="space-y-3">
          <h2 id="export-heading" className="text-lg font-semibold">
            Export
          </h2>
          <p className="text-sm text-neutral-600">
            Download all your applications as a CSV file. Status is not included.
          </p>
          <a
            href="/api/export"
            className="inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Download CSV
          </a>
        </section>

        <section aria-labelledby="import-heading" className="space-y-3">
          <h2 id="import-heading" className="text-lg font-semibold">
            Import
          </h2>
          <p className="text-sm text-neutral-600">
            The first row must be headers. Required columns: <code>company</code>,{" "}
            <code>roleTitle</code>, <code>appliedAt</code> (YYYY-MM-DD). Optional:{" "}
            <code>salaryMin</code>, <code>salaryMax</code>, <code>currency</code>,{" "}
            <code>jobUrl</code>. Files up to 1 MB and 500 rows. Imported applications start in Applied.
          </p>
          <ImportForm />
        </section>
      </div>
    </main>
  );
}