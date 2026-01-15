import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading your garden...</p>
      </div>
    </div>
  )
}
