import { Suspense } from "react";
import { EditApplicationContent } from "./edit-content";

export default function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="p-8">
      <div className="max-w-xl">
        <Suspense fallback={<p className="text-neutral-600">Loading application…</p>}>
          <EditApplicationContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}