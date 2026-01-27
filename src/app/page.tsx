import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Droplets, Flame, Trophy, Sprout } from 'lucide-react';
import { PhilosophySection } from '@/components/landing/philosophy-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { PaddleScript } from '@/components/landing/paddle-script';
import { getAuthUser } from '@/lib/auth';

export default async function Home() {
  const user = await getAuthUser();

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Habien",
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Web, iOS, Android",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "100"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Habit Garden gamifies your personal growth. Each habit is a digital plant that grows as you complete your daily tasks. Neglect them, and they wither.",
            "featureList": "Gamified habit tracking, Daily watering mechanics, Streak bonuses, Visual progress garden"
          }),
        }}
      />
      <PaddleScript />

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24">
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="font-bold text-xl">Habit Garden</span>
          </div>
          <div className="flex gap-3">
            {user ? (
              <Button asChild>
                <Link href="/garden">Go to Garden</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        <main className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="text-6xl mb-8 animate-bounce delay-700">🌳</div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-r from-green-600 to-emerald-600">
            Grow Your Habits,
            <br />
            <span className="text-foreground">Watch Them Flourish</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Transform your daily routines into a thriving digital garden.
            Every positive action nurtures your plants—and yourself.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            {user ? (
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all">
                <Link href="/garden">Go to Garden</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all">
                <Link href="/signup">Start Growing Free</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full">
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
        </main>
      </div>

      {/* Philosophy Section */}
      <PhilosophySection />

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Gamify Your Growth</h2>
            <p className="text-xl text-muted-foreground">
              We make building habits as satisfying as playing a game.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border hover:border-green-500/50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6">
                <Droplets className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-3">Daily Watering</h3>
              <p className="text-muted-foreground">
                Check-in daily to water your plants. Neglect them, and they'll wither.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border hover:border-orange-500/50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mb-6">
                <Flame className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg mb-3">Streak Bonfires</h3>
              <p className="text-muted-foreground">
                Maintain streaks to light up your garden at night with bonfires.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border hover:border-green-500/50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-6">
                <Sprout className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-3">Visual Progress</h3>
              <p className="text-muted-foreground">
                Watch your habits literally grow from seeds to mighty oaks.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border hover:border-yellow-500/50 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center mb-6">
                <Trophy className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="font-bold text-lg mb-3">Harvest Rewards</h3>
              <p className="text-muted-foreground">
                Collect fruits from your trees to unlock new garden skins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-lg">Habit Garden</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Built with love for habit builders everywhere.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/refund" className="hover:text-foreground">Refunds</Link>
            <Link href="mailto:support@habitgarden.com" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
