'use client'

/**
 * Reflection Modal - Multi-step reflection flow for milestones
 *
 * Steps:
 * 1. Life changes checklist (what has improved?)
 * 2. Personal note textarea
 * 3. Mood selector
 */

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Heart,
  Zap,
  Brain,
  Moon,
  Sun,
  Smile,
  Meh,
  Frown,
  PartyPopper,
} from 'lucide-react'
import { createReflection } from '@/lib/actions/journal'
import type { MilestoneType } from '@/types/database'

interface ReflectionModalProps {
  plantId: string
  milestoneType: MilestoneType | string
  milestoneTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

const LIFE_CHANGES = [
  { id: 'energy', label: 'More energy', icon: Zap },
  { id: 'focus', label: 'Better focus', icon: Brain },
  { id: 'mood', label: 'Improved mood', icon: Sun },
  { id: 'sleep', label: 'Better sleep', icon: Moon },
  { id: 'confidence', label: 'More confident', icon: Heart },
  { id: 'consistency', label: 'Building consistency', icon: Check },
]

const MOODS = [
  { id: 'proud', label: 'Proud', emoji: '🏆' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'motivated', label: 'Motivated', emoji: '🔥' },
  { id: 'peaceful', label: 'Peaceful', emoji: '☮️' },
  { id: 'excited', label: 'Excited', emoji: '🎉' },
  { id: 'content', label: 'Content', emoji: '😌' },
]

export function ReflectionModal({
  plantId,
  milestoneType,
  milestoneTitle,
  open,
  onOpenChange,
  onComplete,
}: ReflectionModalProps) {
  const [step, setStep] = useState(1)
  const [selectedChanges, setSelectedChanges] = useState<string[]>([])
  const [personalNote, setPersonalNote] = useState('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 3

  const handleToggleChange = (changeId: string) => {
    setSelectedChanges(prev =>
      prev.includes(changeId)
        ? prev.filter(c => c !== changeId)
        : [...prev, changeId]
    )
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await createReflection({
          plant_id: plantId,
          milestone_type: milestoneType as MilestoneType,
          life_changes: selectedChanges.length > 0 ? selectedChanges : undefined,
          personal_note: personalNote.trim() || undefined,
          mood: selectedMood || undefined,
        })

        if (result.success) {
          setShowSuccess(true)
          setTimeout(() => {
            onOpenChange(false)
            onComplete?.()
            // Reset state
            setStep(1)
            setSelectedChanges([])
            setPersonalNote('')
            setSelectedMood(null)
            setShowSuccess(false)
          }, 1500)
        } else {
          setError(result.error || 'Failed to save reflection')
        }
      } catch (err) {
        console.error('Error saving reflection:', err)
        setError('Something went wrong. Please try again.')
      }
    })
  }

  const canProceed = step === 1 ? true : step === 2 ? true : selectedMood !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4 animate-in zoom-in duration-300">
              <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Reflection Saved!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This memory is now part of your journey
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Reflect on {milestoneTitle}
              </DialogTitle>
              <DialogDescription>
                Take a moment to appreciate how far you&apos;ve come.
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator */}
            <div className="flex items-center gap-1.5 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i < step
                      ? 'bg-purple-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
            </div>

            {/* Step content */}
            <div className="min-h-[280px]">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    What changes have you noticed?
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select all that apply (optional)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {LIFE_CHANGES.map(change => {
                      const Icon = change.icon
                      const isSelected = selectedChanges.includes(change.id)
                      return (
                        <button
                          key={change.id}
                          onClick={() => handleToggleChange(change.id)}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-xl text-left transition-all',
                            'border-2',
                            isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 flex-shrink-0',
                              isSelected
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-slate-400'
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isSelected
                                ? 'text-purple-700 dark:text-purple-300'
                                : 'text-slate-600 dark:text-slate-300'
                            )}
                          >
                            {change.label}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-purple-500 ml-auto" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Write a note to your future self
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    What would you like to remember about this moment?
                  </p>
                  <Textarea
                    value={personalNote}
                    onChange={e => setPersonalNote(e.target.value)}
                    placeholder="I'm proud of myself because..."
                    className="min-h-[160px] resize-none"
                  />
                  <p className="text-xs text-slate-400 text-right">
                    {personalNote.length} characters
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    How are you feeling right now?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {MOODS.map(mood => {
                      const isSelected = selectedMood === mood.id
                      return (
                        <button
                          key={mood.id}
                          onClick={() => setSelectedMood(mood.id)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                            'border-2',
                            isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                          )}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                          <span
                            className={cn(
                              'text-xs font-medium',
                              isSelected
                                ? 'text-purple-700 dark:text-purple-300'
                                : 'text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {mood.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={step === 1}
                className={cn(step === 1 && 'invisible')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  size="sm"
                  disabled={!canProceed || isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isPending ? 'Saving...' : 'Save Reflection'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
