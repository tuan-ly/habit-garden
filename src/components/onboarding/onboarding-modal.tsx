"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ONBOARDING_KEY = "habit-garden-onboarding-completed"
const PROMPT_ADD_PLANT_KEY = "habit-garden-prompt-add-plant"

const TOTAL_SCREENS = 3

interface OnboardingModalProps {
  onOpenAddPlant?: () => void
}

export function OnboardingModal({ onOpenAddPlant }: OnboardingModalProps) {
  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true")
    setOpen(false)
  }

  const handlePlantFirstSeed = () => {
    localStorage.setItem(ONBOARDING_KEY, "true")
    localStorage.setItem(PROMPT_ADD_PLANT_KEY, "true")
    setOpen(false)
    onOpenAddPlant?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "sm:max-w-md overflow-hidden border-0",
          "bg-gradient-to-br from-emerald-50 to-green-50",
          "dark:from-slate-900 dark:to-emerald-950"
        )}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === screen
                  ? "bg-emerald-500 w-6"
                  : i < screen
                  ? "bg-emerald-300 dark:bg-emerald-700 w-1.5"
                  : "bg-slate-200 dark:bg-slate-700 w-1.5"
              )}
            />
          ))}
        </div>

        {screen === 0 && <ScreenVision onNext={() => setScreen(1)} onSkip={handleSkip} />}
        {screen === 1 && <ScreenHowItWorks onNext={() => setScreen(2)} onSkip={handleSkip} />}
        {screen === 2 && <ScreenPlantSeed onPlant={handlePlantFirstSeed} onSkip={handleSkip} />}
      </DialogContent>
    </Dialog>
  )
}

// Screen 1: The Vision
function ScreenVision({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      {/* Animated seedling */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-800/50 flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30">
          <span className="text-5xl" style={{ filter: "drop-shadow(0 2px 8px rgba(16,185,129,0.4))" }}>
            🌱
          </span>
        </div>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 dark:bg-emerald-500/20 blur-xl -z-10" />
      </div>

      <DialogHeader className="gap-2">
        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Build habits that last years
        </DialogTitle>
        <DialogDescription className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Every habit you track becomes a plant in your garden. Show up consistently and watch it grow from a tiny seed into something ancient and beautiful.
        </DialogDescription>
      </DialogHeader>

      <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">
        "Some gardens take years to become forests."
      </p>

      <div className="flex flex-col items-center gap-3 w-full mt-2">
        <Button
          onClick={onNext}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base h-11 rounded-xl shadow-md shadow-emerald-500/30"
        >
          Show me &rarr;
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// Screen 2: How It Works
function ScreenHowItWorks({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const steps = [
    { emoji: "🌱", label: "Plant a habit", detail: "Name a habit" },
    { emoji: "💧", label: "Water it daily", detail: "Tap water every day" },
    { emoji: "🌳", label: "Watch it grow", detail: "Plants grow over months and years" },
  ]

  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <DialogHeader className="gap-2">
        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          How it works
        </DialogTitle>
      </DialogHeader>

      {/* 3-step horizontal flow */}
      <div className="w-full bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                <span className="text-2xl">{step.emoji}</span>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                {step.label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                {step.detail}
              </span>

              {/* Arrow connector (not after last) */}
              {i < steps.length - 1 && (
                <div className="absolute" style={{ display: "none" }} />
              )}
            </div>
          ))}
        </div>

        {/* Connecting arrows between steps */}
        <div className="flex items-center justify-center gap-0 mt-1 px-4">
          <div className="flex-1" />
          <span className="text-emerald-400 text-sm font-bold px-2">&rarr;</span>
          <div className="flex-1" />
          <span className="text-emerald-400 text-sm font-bold px-2">&rarr;</span>
          <div className="flex-1" />
        </div>
      </div>

      {/* Key insight callout */}
      <div className="w-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-700/50 rounded-xl px-4 py-3">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          The longer you keep going, the more beautiful your garden becomes.
        </p>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Miss a day? Your plants sleep peacefully. No guilt.
      </p>

      <div className="flex flex-col items-center gap-3 w-full mt-1">
        <Button
          onClick={onNext}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base h-11 rounded-xl shadow-md shadow-emerald-500/30"
        >
          I&apos;m ready &rarr;
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// Screen 3: Plant Your First Seed
function ScreenPlantSeed({ onPlant, onSkip }: { onPlant: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      {/* Empty garden grid illustration */}
      <div className="w-32 h-32 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shadow-inner">
        <GardenGridIllustration />
      </div>

      <DialogHeader className="gap-2">
        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          What&apos;s one habit you want to build?
        </DialogTitle>
        <DialogDescription className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Start small. One plant. Water it tomorrow.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-3 w-full mt-2">
        <Button
          onClick={onPlant}
          size="lg"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base h-12 rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/40 hover:scale-[1.01]"
        >
          <span className="mr-2">🌱</span>
          Plant My First Seed
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// Simple 3x3 dot grid to suggest an empty garden
function GardenGridIllustration() {
  return (
    <div className="grid grid-cols-3 gap-3 p-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-7 h-7 rounded-lg border-2 border-dashed transition-colors",
            i === 4
              ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
              : "border-slate-200 dark:border-slate-700"
          )}
        />
      ))}
    </div>
  )
}
