import { Skeleton } from "@/components/ui/skeleton"

export default function GardenLoading() {
  return (
    <div className="h-full space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Garden grid skeleton */}
      <div className="flex justify-center items-center py-8">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-20 h-24 rounded-lg"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Info bar skeleton */}
      <div className="mt-auto">
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  )
}
