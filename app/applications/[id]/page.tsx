import Link from "next/link";
import { Suspense } from "react";
import { ApplicationDetail } from "./application-detail";
import { SkeletonBlock, SkeletonRegion } from "@/components/ui/skeleton";

function DetailSkeleton() {
  return (
    <SkeletonRegion label="Loading application">
      <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-7 w-72" />
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="mt-6 h-5 w-24" />
          <SkeletonBlock className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-24" />
          <div className="h-16 rounded-md bg-white shadow-sm" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export default function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="p-8">
      <Link href="/board" className="text-sm text-neutral-600 underline">
        ← Back to pipeline
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ApplicationDetail params={params} />
      </Suspense>
    </main>
  );
}