import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
          H
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Habit Garden
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Next.js 15 + Shadcn/UI + Tailwind CSS v4 + Supabase Template
          </p>
        </div>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">
              Dang nhap
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">
              Dang ky
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Template 2026 - Ready for production</p>
        </div>
      </main>
    </div>
  )
}
