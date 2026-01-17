'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { WeatherType } from '@/types/database'

interface WeatherEffectsProps {
    weather: WeatherType
    className?: string
}

export function WeatherEffects({ weather, className }: WeatherEffectsProps) {
    const [showLightning, setShowLightning] = useState(false)

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
        <div className={cn("absolute inset-0 pointer-events-none z-20 overflow-hidden", className)}>
            {/* Rain drops animation */}
            {(weather === 'rainy' || weather === 'stormy') && (
                <div className="absolute inset-0 w-full h-full">
                    {Array.from({ length: weather === 'stormy' ? 80 : 30 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "absolute w-0.5 animate-rain-drop",
                                weather === 'stormy' ? "h-8 bg-slate-400/60" : "h-5 bg-blue-300/50"
                            )}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${(weather === 'stormy' ? 0.3 : 0.6) + Math.random() * 0.4}s`,
                            }}
                        />
                    ))}
                </div>
            )}

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
