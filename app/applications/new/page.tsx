import Link from "next/link";
import { Suspense } from "react";
import { NewApplicationContent } from "./new-application-content";

export default function NewApplicationPage() {
  return (
    <main className="p-8">
      <div className="max-w-xl">
        <Link href="/board" className="text-sm text-neutral-600 underline">
          ← Back to pipeline
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">New application</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-600">
          New applications start in Applied. Move them on the pipeline board.
        </p>
        <Suspense fallback={<p className="text-neutral-600">Loading form…</p>}>
          <NewApplicationContent />
        </Suspense>
      </div>
    </main>
  );
}