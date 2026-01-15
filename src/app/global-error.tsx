'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <div className="text-6xl">🌿</div>
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-muted-foreground text-center max-w-md">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  )
}
