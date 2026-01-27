'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SOUNDSCAPES = [
    {
        name: "Forest Birds",
        // Source: Mixkit (Free for personal/commercial use) - Local asset
        src: "/sounds/forest.mp3",
        icon: "🌲"
    },
    {
        name: "Ocean Waves",
        // Source: Mixkit - Local asset
        src: "/sounds/ocean.mp3",
        icon: "🌊"
    },
    {
        name: "Gentle Rain",
        // Source: Mixkit - Local asset
        src: "/sounds/rain.mp3",
        icon: "🌧️"
    }
];

interface BackgroundAudioProps {
    isPlaying: boolean;
    className?: string;
    onTrackChange?: (trackIndex: number) => void;
    currentTrackIndex?: number;
}

export function BackgroundAudio({
    isPlaying,
    className,
    onTrackChange,
    currentTrackIndex = 0
}: BackgroundAudioProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    // Safety check for index
    const activeIndex = Math.max(0, Math.min(currentTrackIndex, SOUNDSCAPES.length - 1));
    const currentTrack = SOUNDSCAPES[activeIndex];

    // Handle play/pause with fade
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Reset volume when src changes if playing
        if (isPlaying) {
            // If the source changes, we want to ensure it plays
            // But React handles src updates on the audio element automatically
            // We just need to ensure play is called if it was paused
            audio.play().catch(e => console.error("Audio play failed:", e));
        }

        if (isPlaying) {
            // If starting playback
            if (audio.paused) {
                audio.volume = 0;
                audio.play().catch(e => console.error("Audio play failed:", e));

                // Fade in
                const fadeIn = setInterval(() => {
                    if (audio.volume < volume - 0.05) {
                        audio.volume += 0.05;
                    } else {
                        audio.volume = volume;
                        clearInterval(fadeIn);
                    }
                }, 100);
                return () => clearInterval(fadeIn);
            }
        } else {
            // Fade out
            const fadeOut = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume -= 0.05;
                } else {
                    audio.volume = 0;
                    audio.pause();
                    clearInterval(fadeOut);
                }
            }, 100);

            return () => clearInterval(fadeOut);
        }
    }, [isPlaying, volume, activeIndex]); // Re-run when track changes

    // Handle mute toggle
    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const nextTrack = () => {
        if (onTrackChange) {
            onTrackChange((activeIndex + 1) % SOUNDSCAPES.length);
        }
    };

    return (
        <div className={cn("flex items-center gap-2 pointer-events-auto", className)}>
            <audio
                ref={audioRef}
                src={currentTrack.src}
                loop
                playsInline
            />
            {isPlaying && (
                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full p-1 pr-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                    >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>

                    <button
                        onClick={nextTrack}
                        className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
                        title="Click to change soundscape"
                    >
                        <span className="text-base">{currentTrack.icon}</span>
                        <span className="font-medium hidden sm:inline-block w-20 truncate text-start">
                            {currentTrack.name}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
