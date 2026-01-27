import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Database, Cookie, Mail } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50/30 dark:from-green-950 dark:via-background dark:to-green-950/30">
            {/* Decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-green-200/20 dark:bg-green-800/10 rounded-full blur-3xl" />
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl" />
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
                        <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-green-900 dark:text-green-100 mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {/* Introduction */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">1</span>
                            Introduction
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Habit Garden (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website or use our application.
                        </p>
                    </section>

                    {/* Data We Collect */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">2</span>
                            Data We Collect
                        </h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            We may collect, use, store and transfer different kinds of personal data about you:
                        </p>
                        <div className="grid gap-4">
                            <div className="flex gap-4 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                                <Database className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">Identity Data</h3>
                                    <p className="text-sm text-muted-foreground">Includes your email address when you sign up.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                                <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">Usage Data</h3>
                                    <p className="text-sm text-muted-foreground">Information about how you use our website, products and services (e.g., habit tracking data).</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl">
                                <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">Technical Data</h3>
                                    <p className="text-sm text-muted-foreground">Your IP address, browser type and version, time zone setting and location, and operating system.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Your Data */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">3</span>
                            How We Use Your Data
                        </h2>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                            We will only use your personal data when the law allows us to:
                        </p>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0" />
                                To provide the Service and manage your account.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0" />
                                To process your payments (via our third-party reseller, Paddle).
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0" />
                                To manage our relationship with you.
                            </li>
                        </ul>
                    </section>

                    {/* Third-Party Services */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">4</span>
                            Third-Party Services
                        </h2>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                            <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-amber-700 dark:text-amber-400">Paddle:</strong> Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Your payment data is processed securely by Paddle and is not stored on our servers.
                            </p>
                        </div>
                    </section>

                    {/* Your Rights */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg text-sm font-bold text-green-600">5</span>
                            Your Rights
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to access, correct, or delete your personal data. You can manage your account settings within the application or contact us at <a href="mailto:support@habitgarden.com" className="text-green-600 dark:text-green-400 hover:underline">support@habitgarden.com</a> to request data deletion.
                        </p>
                    </section>

                    {/* Cookies */}
                    <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-green-100 dark:border-green-900/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <Cookie className="w-6 h-6 text-green-600 dark:text-green-400" />
                            Cookies
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and allows us to improve our site.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl p-8 shadow-sm border border-green-200 dark:border-green-800/50">
                        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-3">
                            <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                            Contact Us
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            If you have any questions about this privacy policy, please contact us:
                        </p>
                        <a
                            href="mailto:support@habitgarden.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
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
                        <Link href="/terms" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/pricing" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Pricing
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
