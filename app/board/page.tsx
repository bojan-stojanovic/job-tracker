import Link from "next/link";
import { Suspense } from "react";
import { BoardContent } from "./board-content";
import { PageHeader } from "@/components/page-header";
import { SkeletonBlock, SkeletonRegion } from "@/components/ui/skeleton";

function BoardSkeleton() {
  return (
    <SkeletonRegion label="Loading applications">
      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-neutral-100 p-3">
            <SkeletonBlock className="h-4 w-24" />
            <div className="h-20 rounded-md bg-white" />
            <div className="h-20 rounded-md bg-white" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export default function BoardPage() {
  return (
    <main className="p-8">
      <PageHeader
        title="Pipeline"
        description="Drag cards between columns, or use the Move to menu."
        actions={
          <Link
            href="/applications/new"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
          >
            New application
          </Link>
        }
      />
      <Suspense fallback={<BoardSkeleton />}>
        <BoardContent />
      </Suspense>
    </main>
  );
}