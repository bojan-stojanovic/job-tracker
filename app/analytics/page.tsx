import { Suspense } from "react";
import { AnalyticsContent } from "./analytics-content";
import { PageHeader } from "@/components/page-header";
import { SkeletonBlock, SkeletonRegion } from "@/components/ui/skeleton";

function AnalyticsSkeleton() {
  return (
    <SkeletonRegion label="Loading analytics">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white p-4 shadow-sm">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <SkeletonBlock className="mb-3 h-5 w-40" />
        <SkeletonBlock className="h-72 w-full rounded-lg" />
      </div>
    </SkeletonRegion>
  );
}

export default function AnalyticsPage() {
  return (
    <main className="p-8">
      <PageHeader title="Analytics" description="How your pipeline is performing." />
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </main>
  );
}