'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlantType } from '@/types/database'
import { createPlant } from '@/lib/actions/plants'
import { usePlants } from '@/lib/context'
import { toast } from 'sonner'

interface AddPlantDialogProps {
  plantTypes: PlantType[]
  // Support controlled mode for isometric garden
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddPlantDialog({ plantTypes, open: controlledOpen, onOpenChange }: AddPlantDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const { addPlant } = usePlants()

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setUncontrolledOpen
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [selectedType, setSelectedType] = useState<PlantType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  const basicPlants = plantTypes.filter((p) => p.category === 'basic')
  const specialPlants = plantTypes.filter((p) => p.category === 'special')

  const handleSelectType = (plantType: PlantType) => {
    setSelectedType(plantType)
    setStep('details')
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !name.trim()) return

    startTransition(async () => {
      const result = await createPlant({
        plant_type_id: selectedType.id,
        name: name.trim(),
        habit_description: description.trim() || undefined,
      })

      if (result.success && result.plant) {
        // Add plant to context immediately for instant UI update
        addPlant(result.plant)
        
        toast.success('Plant created!', {
          description: `${name} has been planted in your garden.`,
        })
        setOpen(false)
        resetForm()
      } else {
        toast.error('Failed to create plant', {
          description: result.error,
        })
      }
    })
  }

  const resetForm = () => {
    setStep('select')
    setSelectedType(null)
    setName('')
    setDescription('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Only show trigger button in uncontrolled mode */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Plant
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a Plant Type</DialogTitle>
              <DialogDescription>
                Each plant type has different growth requirements and maturity times.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-medium mb-3">Basic Plants</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {basicPlants.map((plant) => (
                    <button
                      key={plant.id}
                      onClick={() => handleSelectType(plant)}
                      className="flex flex-col items-center p-4 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left"
                    >
                      <span className="text-3xl mb-2">{plant.icon}</span>
                      <span className="font-medium text-sm">{plant.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{plant.maturity_days} days</span>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full mt-2',
                          getDifficultyColor(plant.difficulty)
                        )}
                      >
                        {plant.difficulty}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Special Plants
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specialPlants.map((plant) => (
                    <button
                      key={plant.id}
                      onClick={() => handleSelectType(plant)}
                      className="flex flex-col items-center p-4 rounded-lg border border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors text-left"
                    >
                      <span className="text-3xl mb-2">{plant.icon}</span>
                      <span className="font-medium text-sm">{plant.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{plant.maturity_days} days</span>
                      </div>
                      {plant.special_effect && (
                        <span className="text-xs text-purple-600 mt-1">
                          Special ability
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedType?.icon}</span>
                Plant a {selectedType?.name}
              </DialogTitle>
              <DialogDescription>
                Give your habit a name and description to help you stay motivated.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Morning Exercise, Read 30 mins, Meditate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Why is this habit important to you?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted">
                <h4 className="font-medium text-sm mb-2">Plant Info</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Matures in {selectedType?.maturity_days} days</li>
                  <li>• Frequency: {selectedType?.frequency_type === 'daily' ? 'Daily check-in' : 'Flexible'}</li>
                  <li>• Moisture decay: {selectedType?.moisture_decay_rate}% per day without watering</li>
                  {selectedType?.special_effect && (
                    <li className="text-purple-600">• Has special ability!</li>
                  )}
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Planting...' : 'Plant Habit'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
