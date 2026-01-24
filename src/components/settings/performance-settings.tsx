'use client'

import { useGardenSettings } from '@/lib/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Zap, Sparkles, TreeDeciduous, PartyPopper, Cloud, Gauge } from 'lucide-react'

export function PerformanceSettings() {
  const { settings, updateSetting, enableAll, disableAll } = useGardenSettings()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance
        </CardTitle>
        <CardDescription>
          Disable effects to improve performance on low-end devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={enableAll}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disableAll}
            className="flex-1"
          >
            <Gauge className="h-4 w-4 mr-2" />
            Disable All
          </Button>
        </div>

        <Separator />

        {/* Ambient particles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">Particle Effects</p>
              <p className="text-sm text-muted-foreground">
                Butterflies, fireflies, pollen
              </p>
            </div>
          </div>
          <Switch
            checked={settings.showParticles}
            onCheckedChange={(checked) => updateSetting('showParticles', checked)}
          />
        </div>

        <Separator />

        {/* Decorations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TreeDeciduous className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Garden Decorations</p>
              <p className="text-sm text-muted-foreground">
                Bushes, rocks, mushrooms, flowers
              </p>
            </div>
          </div>
          <Switch
            checked={settings.showDecorations}
            onCheckedChange={(checked) => updateSetting('showDecorations', checked)}
          />
        </div>

        <Separator />

        {/* Celebrations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Celebration Effects</p>
              <p className="text-sm text-muted-foreground">
                XP popup, fireworks on watering
              </p>
            </div>
          </div>
          <Switch
            checked={settings.showCelebrations}
            onCheckedChange={(checked) => updateSetting('showCelebrations', checked)}
          />
        </div>

        <Separator />

        {/* Weather effects */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Weather Effects</p>
              <p className="text-sm text-muted-foreground">
                Rain, falling leaves by weather
              </p>
            </div>
          </div>
          <Switch
            checked={settings.showWeatherEffects}
            onCheckedChange={(checked) => updateSetting('showWeatherEffects', checked)}
          />
        </div>

        <Separator />

        {/* Canvas renderer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">Canvas Renderer</p>
              <p className="text-sm text-muted-foreground">
                Use Canvas instead of SVG (faster)
              </p>
            </div>
          </div>
          <Switch
            checked={settings.useCanvasRenderer}
            onCheckedChange={(checked) => updateSetting('useCanvasRenderer', checked)}
          />
        </div>

        <Separator />

        {/* Reduced motion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-muted-foreground">
                Disable most animations
              </p>
            </div>
          </div>
          <Switch
            checked={settings.reducedMotion}
            onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
