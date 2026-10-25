export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-neutral-200 ${className}`} />;
}

// Wraps skeleton content so screen readers get one "loading" announcement
// instead of reading empty placeholders.
export function SkeletonRegion({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className="animate-pulse">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}