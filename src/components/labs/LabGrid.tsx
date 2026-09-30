import Skeleton from "@/components/ui/Skeleton";

export function LabGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading labs">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-ink bg-white p-0 shadow-[5px_5px_0_var(--ink)]">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
