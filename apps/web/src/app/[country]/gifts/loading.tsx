import { Skeleton } from "@/components/ui";

/** Shape of the page while the gifts load: heading, chips, then a grid of cards. */
export default function GiftsLoading() {
  return (
    <div role="status" aria-label="Loading ready-made gifts" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56 max-w-full sm:h-10" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-24 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full" />
        <Skeleton className="h-11 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 sm:gap-6">
        {[0, 1, 2].map((key) => (
          <div key={key} className="bg-surface shadow-hairline min-w-0 overflow-hidden rounded-md">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
