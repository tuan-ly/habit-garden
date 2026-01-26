'use client';

import { motion } from 'framer-motion';
import { Leaf, Target, User } from 'lucide-react';

export function PhilosophySection() {
    return (
        <section className="py-24 bg-green-50 dark:bg-green-950/20">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-green-800 dark:text-green-100">
                            Who Do You Want To Become?
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            True behavior change is identity change. You might start a habit because of motivation,
                            but you'll stick with it because it becomes who you are.
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        {
                            icon: Target,
                            title: "Outcome Based",
                            description: "Most people focus on what they want to achieve (losing weight, writing a book). This leads to temporary results.",
                            color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
                        },
                        {
                            icon: User,
                            title: "Identity Based",
                            description: "We focus on who you wish to become. Every action you take is a vote for the type of person you wish to become.",
                            color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
                        },
                        {
                            icon: Leaf,
                            title: "Small Wins",
                            description: "You don't need to change everything at once. Decide the type of person you want to be. Prove it to yourself with small wins.",
                            color: "text-green-500 bg-green-100 dark:bg-green-900/30",
                        },
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-white dark:bg-card p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${item.color}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
