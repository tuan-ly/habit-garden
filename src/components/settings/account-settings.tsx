'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateDisplayName } from '@/lib/actions/profile'

interface AccountSettingsProps {
  email: string
  defaultDisplayName: string
}

export function AccountSettings({ email, defaultDisplayName }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState(defaultDisplayName)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateDisplayName(displayName)
      if (result.success) {
        toast.success('Display name updated')
      } else {
        toast.error(result.error || 'Failed to update display name')
      }
    } catch {
      toast.error('Failed to update display name')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account
        </CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your email address cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="Enter your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
}
