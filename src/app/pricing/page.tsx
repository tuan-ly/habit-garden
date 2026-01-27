import { PricingSection } from "@/components/landing/pricing-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/50 to-white dark:from-green-950 dark:via-emerald-950/50 dark:to-background">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl" />
                <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl" />
            </div>

            <nav className="relative container mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xl font-bold text-green-800 dark:text-green-200 hover:text-green-600 dark:hover:text-green-300 transition-colors"
                    >
                        <span className="text-2xl">🌱</span>
                        <span>Habit Garden</span>
                    </Link>
                    <Button asChild variant="ghost" className="gap-2 hover:bg-green-100 dark:hover:bg-green-900/50">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </nav>

            <main className="relative">
                {/* Hero section */}
                <div className="container mx-auto px-4 pt-8 pb-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/50 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-green-900 dark:text-green-100 mb-4">
                        Choose Your Garden Plan
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
                    </p>
                </div>

                <PricingSection />
            </main>

            <footer className="relative border-t border-green-200/50 dark:border-green-800/50 py-12 bg-gradient-to-b from-transparent to-green-50/50 dark:to-green-950/50 mt-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-xl">🌱</span>
                        <span className="font-semibold text-green-800 dark:text-green-200">Habit Garden</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                        &copy; {new Date().getFullYear()} Habit Garden. All rights reserved.
                    </p>
                    <div className="flex justify-center gap-8 text-sm">
                        <Link href="/privacy" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/refund" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Refund Policy
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
