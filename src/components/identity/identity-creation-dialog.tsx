'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createIdentity, getIdentityPresets } from '@/lib/actions/identity'
import { toast } from 'sonner'
import type { IdentityWithGoals, IdentityColor, IdentityPreset } from '@/types/database'

interface IdentityCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (identity: IdentityWithGoals) => void
}

type WizardStep = 'preset' | 'customize' | 'preview'

// Color options with display info
const COLOR_OPTIONS: { id: IdentityColor; label: string; gradient: string; ring: string }[] = [
  { id: 'purple', label: 'Purple', gradient: 'from-purple-500 to-violet-500', ring: 'ring-purple-500' },
  { id: 'blue', label: 'Blue', gradient: 'from-blue-500 to-sky-500', ring: 'ring-blue-500' },
  { id: 'green', label: 'Green', gradient: 'from-green-500 to-emerald-500', ring: 'ring-green-500' },
  { id: 'amber', label: 'Amber', gradient: 'from-amber-500 to-yellow-500', ring: 'ring-amber-500' },
  { id: 'rose', label: 'Rose', gradient: 'from-rose-500 to-pink-500', ring: 'ring-rose-500' },
  { id: 'cyan', label: 'Cyan', gradient: 'from-cyan-500 to-teal-500', ring: 'ring-cyan-500' },
  { id: 'pink', label: 'Pink', gradient: 'from-pink-500 to-fuchsia-500', ring: 'ring-pink-500' },
  { id: 'orange', label: 'Orange', gradient: 'from-orange-500 to-amber-500', ring: 'ring-orange-500' },
]

// Common emojis for identity icons
const ICON_OPTIONS = ['🎯', '📚', '🏃', '💻', '🎨', '🎓', '🧘', '🔨', '🌍', '🎵', '✍️', '📷', '🌱', '💪', '🧠', '❤️']

export function IdentityCreationDialog({ open, onOpenChange, onSuccess }: IdentityCreationDialogProps) {
  const [step, setStep] = useState<WizardStep>('preset')
  const [isPending, startTransition] = useTransition()
  const presets = getIdentityPresets()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState<IdentityColor>('purple')

  const resetForm = () => {
    setStep('preset')
    setName('')
    setDescription('')
    setIcon('🎯')
    setColor('purple')
  }

  const handlePresetSelect = (preset: IdentityPreset) => {
    setName(preset.name)
    setDescription(preset.description)
    setIcon(preset.icon)
    setColor(preset.color)
    setStep('customize')
  }

  const handleCustom = () => {
    setName('')
    setDescription('')
    setStep('customize')
  }

  const handleBack = () => {
    if (step === 'customize') setStep('preset')
    else if (step === 'preview') setStep('customize')
  }

  const handleNext = () => {
    if (step === 'customize') {
      if (!name.trim()) {
        toast.error('Please enter a name for your identity')
        return
      }
      setStep('preview')
    }
  }

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createIdentity({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
      })

      if (result.success && result.identity) {
        toast.success(`Identity "${result.identity.name}" created!`)
        onSuccess?.({ ...result.identity, goals: [] } as IdentityWithGoals)
        resetForm()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to create identity')
      }
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 'preset' && 'Choose Your Identity'}
            {step === 'customize' && 'Customize Identity'}
            {step === 'preview' && 'Preview'}
          </DialogTitle>
          <DialogDescription>
            {step === 'preset' && 'Start with a preset or create your own.'}
            {step === 'customize' && 'Make it yours.'}
            {step === 'preview' && "Here's how your identity will look."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Preset selection */}
          {step === 'preset' && (
            <div className="space-y-3">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 text-left',
                    'hover:border-purple-300 dark:hover:border-purple-700',
                    'hover:bg-purple-50/50 dark:hover:bg-purple-950/20',
                    'transition-all duration-200',
                    'border-slate-200 dark:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{preset.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{preset.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}

              {/* Custom option */}
              <button
                onClick={handleCustom}
                className={cn(
                  'w-full p-3 rounded-xl border-2 border-dashed text-left',
                  'hover:border-purple-300 dark:hover:border-purple-700',
                  'hover:bg-purple-50/50 dark:hover:bg-purple-950/20',
                  'transition-all duration-200',
                  'border-slate-300 dark:border-slate-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 flex items-center justify-center text-xl">
                    ✨
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Create Custom</p>
                    <p className="text-sm text-muted-foreground">Define your own identity</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Customize */}
          {step === 'customize' && (
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Identity Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Reader, Athlete, Developer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-medium"
                  maxLength={30}
                />
              </div>

              {/* Icon selection */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={cn(
                        'w-10 h-10 rounded-lg text-xl transition-all',
                        'hover:bg-slate-100 dark:hover:bg-slate-800',
                        icon === emoji
                          ? 'bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500'
                          : 'bg-slate-50 dark:bg-slate-800/50'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selection */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setColor(opt.id)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        `bg-gradient-to-br ${opt.gradient}`,
                        color === opt.id ? 'ring-2 ring-offset-2 scale-110' : '',
                        color === opt.id && opt.ring
                      )}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What does this identity mean to you?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div
                className={cn(
                  'p-4 rounded-xl border-2',
                  'bg-gradient-to-br',
                  color === 'purple' && 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800',
                  color === 'blue' && 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-blue-200 dark:border-blue-800',
                  color === 'green' && 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800',
                  color === 'amber' && 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800',
                  color === 'rose' && 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800',
                  color === 'cyan' && 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 border-cyan-200 dark:border-cyan-800',
                  color === 'pink' && 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30 border-pink-200 dark:border-pink-800',
                  color === 'orange' && 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-2xl shadow-sm">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      'font-bold text-lg',
                      color === 'purple' && 'text-purple-600 dark:text-purple-400',
                      color === 'blue' && 'text-blue-600 dark:text-blue-400',
                      color === 'green' && 'text-green-600 dark:text-green-400',
                      color === 'amber' && 'text-amber-600 dark:text-amber-400',
                      color === 'rose' && 'text-rose-600 dark:text-rose-400',
                      color === 'cyan' && 'text-cyan-600 dark:text-cyan-400',
                      color === 'pink' && 'text-pink-600 dark:text-pink-400',
                      color === 'orange' && 'text-orange-600 dark:text-orange-400'
                    )}>
                      {name}
                    </h3>
                    {description && (
                      <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">0 goals linked</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                You can link goals to this identity after creating it.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== 'preset' && (
            <Button variant="ghost" onClick={handleBack} disabled={isPending}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

          {step === 'customize' && (
            <Button onClick={handleNext} disabled={!name.trim()}>
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {step === 'preview' && (
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-gradient-to-r from-purple-500 to-violet-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Create Identity
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
