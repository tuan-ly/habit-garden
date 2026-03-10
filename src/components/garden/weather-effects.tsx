'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { WeatherType } from '@/types/database'

interface WeatherEffectsProps {
    weather: WeatherType
    className?: string
    /** If true, uses absolute positioning instead of fixed */
    contained?: boolean
    /** Value between 0 and 1 for breathing animation */
    breathingValue?: number
}

export function WeatherEffects({ weather, className, contained, breathingValue = 0 }: WeatherEffectsProps) {
    const [showLightning, setShowLightning] = useState(false)
    const [rainDrops, setRainDrops] = useState<Array<{
        id: number;
        left: string;
        delay: string;
        duration: string;
    }>>([]);

    // Generate rain drops only on client to avoid hydration mismatch
    useEffect(() => {
        if (weather !== 'rainy' && weather !== 'stormy') {
            setRainDrops([]);
            return;
        }
        const count = weather === 'stormy' ? 40 : 20;
        const drops = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`,
            duration: `${(weather === 'stormy' ? 0.3 : 0.6) + Math.random() * 0.4}s`,
        }));
        setRainDrops(drops);
    }, [weather]);

    // Lightning effect logic
    useEffect(() => {
        if (weather !== 'stormy') {
            setShowLightning(false);
            return;
        }

        let timeoutId: NodeJS.Timeout;

        const scheduleNextFlash = () => {
            // Random interval between 8 and 25 seconds
            const nextInterval = 8000 + Math.random() * 17000;

            timeoutId = setTimeout(() => {
                triggerFlash();
                scheduleNextFlash();
            }, nextInterval);
        };

        const triggerFlash = () => {
            setShowLightning(true);
            // specific flash duration
            setTimeout(() => setShowLightning(false), 200 + Math.random() * 300);

            // Potential double flash
            if (Math.random() > 0.7) {
                setTimeout(() => {
                    setShowLightning(true);
                    setTimeout(() => setShowLightning(false), 100);
                }, 400 + Math.random() * 300);
            }
        };

        // Initial delay
        scheduleNextFlash();

        return () => clearTimeout(timeoutId);
    }, [weather]);

    if (weather !== 'rainy' && weather !== 'stormy') return null;

    return (
        <div className={cn(
            contained ? "absolute" : "fixed",
            "inset-0 pointer-events-none z-20 overflow-hidden",
            "[contain:strict]",
            className
        )}>
            {/* Rain drops animation */}
            {rainDrops.map((drop) => (
                <div
                    key={drop.id}
                    className={cn(
                        "absolute w-0.5 animate-rain-drop opacity-0",
                        weather === 'stormy' ? "h-8 bg-slate-400/60" : "h-5 bg-blue-300/50"
                    )}
                    style={{
                        left: drop.left,
                        animationDelay: drop.delay,
                        animationDuration: drop.duration,
                        willChange: 'transform',
                        opacity: breathingValue > 0 ? 0.3 + breathingValue * 0.7 : undefined,
                    }}
                />
            ))}

            {/* Lightning Effect for Stormy */}
            {weather === 'stormy' && (
                <div
                    className={cn(
                        "absolute inset-0 bg-white mix-blend-hard-light transition-opacity duration-100",
                        showLightning ? "opacity-30" : "opacity-0"
                    )}
                />
            )}
        </div>
    )
}
