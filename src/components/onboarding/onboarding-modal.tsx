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
import { Sprout, Droplets, Target, Trophy, ChevronRight, ChevronLeft, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const ONBOARDING_KEY = "habit-garden-onboarding-completed"

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
  highlight?: string
}

const steps: OnboardingStep[] = [
  {
    icon: <Sprout className="h-12 w-12 text-green-500" />,
    title: "Welcome to Habit Garden!",
    description: "Turn your habits into a beautiful garden. Each habit is a plant that needs daily care to grow and thrive.",
    highlight: "Let's take a quick tour!",
  },
  {
    icon: <Droplets className="h-12 w-12 text-blue-500" />,
    title: "Water Your Plants Daily",
    description: "When you complete a habit, water your plant. Moisture keeps your plant healthy - don't let it dry out or it will wilt!",
    highlight: "Tip: Water in the morning for bonus XP!",
  },
  {
    icon: <Target className="h-12 w-12 text-amber-500" />,
    title: "Set Goals & Track Progress",
    description: "Add measurable goals to your plants. Track running distance, savings, study hours - whatever you want to improve!",
    highlight: "Goals adapt to your performance automatically.",
  },
  {
    icon: <Trophy className="h-12 w-12 text-yellow-500" />,
    title: "Earn XP & Achievements",
    description: "Level up by caring for your plants. Unlock achievements, maintain streaks, and watch your garden flourish!",
    highlight: "Check the weather for bonus opportunities!",
  },
  {
    icon: <Sparkles className="h-12 w-12 text-purple-500" />,
    title: "Ready to Grow?",
    description: "Start by creating your first plant. Choose a habit you want to build and give it a name. Your journey begins now!",
    highlight: "Click the + button to add your first plant.",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => setOpen(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true")
    setOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const step = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
              {step.icon}
            </div>
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {step.description}
          </DialogDescription>
          {step.highlight && (
            <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">
              {step.highlight}
            </p>
          )}
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep
                  ? "bg-green-500 w-6"
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-green-600 hover:bg-green-700"
            >
              {currentStep === steps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
