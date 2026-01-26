'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PADDLE_CONFIG } from './product-config';
import { getPaddleInstance } from '@/lib/paddle';

export function PricingSection() {
    const handleCheckout = async (priceId: string) => {
        const paddle = await getPaddleInstance();
        if (paddle) {
            paddle.Checkout.open({
                items: [{ priceId, quantity: 1 }],
            });
        } else {
            console.error('Paddle not initialized');
        }
    };

    return (
        <section className="py-24" id="pricing">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Invest In Your Growth</h2>
                    <p className="text-xl text-muted-foreground">
                        Choose the plan that best fits your journey. Start for free, upgrade when you're ready to commit.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto align-start">
                    {/* Free Tier */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-2xl">Seedling</CardTitle>
                            <CardDescription>Perfect for getting started</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {['Track up to 3 Habits', 'Basic Garden Visuals', 'Daily Check-ins', '7-Day History'].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline" asChild>
                                <a href="/signup">Start Free</a>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Monthly Tier */}
                    <Card className="flex flex-col border-green-500 shadow-lg scale-105 relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Most Popular
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl text-green-600">Gardener</CardTitle>
                            <CardDescription>For serious habit builders</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">{PADDLE_CONFIG.products.monthly.price}</span>
                                <span className="text-muted-foreground">/{PADDLE_CONFIG.products.monthly.interval}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {[
                                    'Unlimited Habits',
                                    'Premium Garden Skins',
                                    'Advanced Analytics',
                                    'Unlimited Historical Data',
                                    'Priority Support'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleCheckout(PADDLE_CONFIG.products.monthly.priceId)}
                            >
                                Subscribe Monthly
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Lifetime Tier */}
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-2xl">Master Gardener</CardTitle>
                            <CardDescription>Commit to a lifetime of growth</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">{PADDLE_CONFIG.products.lifetime.price}</span>
                                <span className="text-muted-foreground">/one-time</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {[
                                    'Everything in Gardener',
                                    'Lifetime Access',
                                    'Early Access to New Features',
                                    'Exclusive "Founder" Badge',
                                    'Supporter Discord Role'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleCheckout(PADDLE_CONFIG.products.lifetime.priceId)}
                            >
                                Get Lifetime Access
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    );
}
