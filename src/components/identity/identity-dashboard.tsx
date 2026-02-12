'use client'

import { useState } from 'react'
import { Plus, Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IdentityWithGoals } from '@/types/database'
import { IdentityCard } from './identity-card'
import { IdentityCreationDialog } from './identity-creation-dialog'
import { IdentityDetailSheet } from './identity-detail-sheet'
import { FeatureLock } from '@/components/game-ui/upgrade-modal'
import { useSubscription } from '@/lib/context/subscription-context'

interface IdentityDashboardProps {
  initialIdentities: IdentityWithGoals[]
}

export function IdentityDashboard({ initialIdentities }: IdentityDashboardProps) {
  const { hasIdentity, showUpgradeModal } = useSubscription()
  const [identities, setIdentities] = useState<IdentityWithGoals[]>(initialIdentities)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityWithGoals | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Feature gate - show upgrade prompt if not PREMIUM
  if (!hasIdentity) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 mb-4">
            <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Identity System</h1>
          <p className="text-muted-foreground">
            Define who you want to become and group your goals under meaningful identities.
          </p>
        </div>

        <FeatureLock
          feature="Identity System"
          requiredTier="premium"
          onUpgrade={() => showUpgradeModal('level_13_identity', 'Identity System')}
        />

        {/* Preview of what they'll get */}
        <div className="mt-8 space-y-4 opacity-50 pointer-events-none">
          <p className="text-sm font-medium text-muted-foreground text-center">Preview</p>
          <div className="space-y-3">
            {[
              { name: 'Reader', icon: '📚', color: 'purple', progress: 67 },
              { name: 'Athlete', icon: '🏃', color: 'green', progress: 45 },
            ].map((preview) => (
              <div
                key={preview.name}
                className={cn(
                  'p-4 rounded-xl border-2 border-dashed',
                  'bg-gradient-to-br from-slate-50 to-slate-100',
                  'dark:from-slate-800/50 dark:to-slate-900/50',
                  'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">
                    {preview.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{preview.name}</p>
                    <p className="text-sm text-muted-foreground">{preview.progress}% progress</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleCreateSuccess = (newIdentity: IdentityWithGoals) => {
    setIdentities((prev) => [newIdentity, ...prev])
    setCreateDialogOpen(false)
  }

  const handleIdentityClick = (identity: IdentityWithGoals) => {
    setSelectedIdentity(identity)
    setDetailSheetOpen(true)
  }

  const handleIdentityUpdate = (updated: IdentityWithGoals) => {
    setIdentities((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    setSelectedIdentity(updated)
  }

  const handleIdentityDelete = (deletedId: string) => {
    setIdentities((prev) => prev.filter((i) => i.id !== deletedId))
    setDetailSheetOpen(false)
    setSelectedIdentity(null)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>My Identities</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground">Who you are becoming</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create
        </Button>
      </div>

      {/* Identity list */}
      {identities.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 mb-4">
            <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No identities yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first identity to start defining who you want to become.
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-violet-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Identity
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {identities.map((identity) => (
            <IdentityCard
              key={identity.id}
              identity={identity}
              onClick={() => handleIdentityClick(identity)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <IdentityCreationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Detail sheet */}
      {selectedIdentity && (
        <IdentityDetailSheet
          identity={selectedIdentity}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          onUpdate={handleIdentityUpdate}
          onDelete={handleIdentityDelete}
        />
      )}
    </div>
  )
}
