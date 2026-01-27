import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, Calendar, CreditCard, XCircle, Mail } from "lucide-react";

export default function RefundPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50/30 dark:from-green-950 dark:via-background dark:to-green-950/30">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-32 left-20 w-72 h-72 bg-green-200/20 dark:bg-green-800/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl" />
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

            <main className="relative container mx-auto px-4 max-w-4xl py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl mb-6">
                        <RefreshCcw className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-green-900 dark:text-green-100 mb-4">
                        Refund Policy
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {/* Satisfaction Guarantee */}
                    <section className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl p-8 shadow-sm border border-green-200 dark:border-green-800/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-white/50 dark:bg-green-800/50 rounded-lg text-sm font-bold text-green-600">1</span>
                            Satisfaction Guarantee
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We want you to be completely satisfied with Habit Garden. If you are not happy with our service, we offer a refund policy as described below. Your satisfaction is our priority.
                        </p>
                    </section>

                    {/* Refund Period */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">2</span>
                            Refund Period
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-green-50/50 dark:bg-green-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <h3 className="font-semibold text-green-800 dark:text-green-200">Monthly Subscriptions</h3>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">14</span>
                                    <span className="text-muted-foreground">days</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Request a refund within 14 days of your initial purchase or renewal date if you are not satisfied.
                                </p>
                            </div>
                            <div className="bg-amber-50/50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-100 dark:border-amber-800/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Lifetime License</h3>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">30</span>
                                    <span className="text-muted-foreground">days</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Request a refund within 30 days of your purchase for lifetime license purchases.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* How to Request */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">3</span>
                            How to Request a Refund
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            To request a refund, please contact our support team with your order details:
                        </p>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-xs font-bold text-green-600">1</span>
                                Email address used for purchase
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-xs font-bold text-green-600">2</span>
                                Transaction ID
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-xs font-bold text-green-600">3</span>
                                Reason for refund (optional)
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-blue-700 dark:text-blue-400">Alternative:</strong> Because our order process is conducted by our online reseller Paddle.com, you can also contact Paddle for assistance with returns and refunds.
                            </p>
                        </div>
                    </section>

                    {/* Cancellations */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <XCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            Cancellations
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You can cancel your subscription at any time to prevent future charges. Your access to premium features will continue until the end of the current billing period. We believe in giving you full control over your subscription.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 rounded-2xl p-8 shadow-lg text-white">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                            <Mail className="w-6 h-6" />
                            Need Help?
                        </h2>
                        <p className="text-green-100 leading-relaxed mb-6">
                            Our support team is here to help you with any questions about refunds or cancellations.
                        </p>
                        <a
                            href="mailto:support@habitgarden.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-green-50 text-green-700 rounded-xl font-medium transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            support@habitgarden.com
                        </a>
                    </section>
                </div>
            </main>

            <footer className="relative border-t border-green-200/50 dark:border-green-800/50 py-12 bg-gradient-to-b from-transparent to-green-50/50 dark:to-green-950/50 mt-12">
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
                        <Link href="/pricing" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Pricing
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
