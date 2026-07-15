'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ImagePlus, RotateCcw, Save, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGroundedArtTransform, getTileOffsetTransform } from '@/lib/assets/game-asset-display'
import { getDecorationPixelSize } from '@/lib/assets/game-asset-render-metrics'
import type { GameAssetDisplaySpec } from '@/lib/assets/game-asset-contract'
import type {
  GameAssetOverride,
  GameAssetStudioEntry,
  ImportedAssetAnalysis,
} from '@/lib/assets/asset-studio-types'
import { getSanctuarySafeInsets } from '@/lib/garden/camera-safe-area'
import { cn } from '@/lib/utils'

type ScenePreset = 'alpha' | 'sanctuary' | 'edge' | 'neighbor' | 'mobile'
type RenderMode = 'placed' | 'ghost'
type DisplayField = keyof GameAssetDisplaySpec

const DISPLAY_FIELDS: Array<{
  key: DisplayField
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: 'anchorX', label: 'Anchor X', min: 0, max: 1, step: 0.001 },
  { key: 'anchorY', label: 'Anchor Y', min: 0, max: 1, step: 0.001 },
  { key: 'scale', label: 'Scale', min: 0.5, max: 1.5, step: 0.01 },
  { key: 'offsetX', label: 'Offset X', min: -0.5, max: 0.5, step: 0.01 },
  { key: 'offsetY', label: 'Offset Y', min: -0.5, max: 0.5, step: 0.01 },
]

const VIEWPORTS = {
  mobile: { label: '390 × 844', width: 390, height: 844 },
  tablet: { label: '768 × 1024', width: 768, height: 1024 },
  desktop: { label: '1440 × 900', width: 1440, height: 900 },
} as const

const SCENES: Record<ScenePreset, string> = {
  alpha: 'Alpha Inspection',
  sanctuary: 'Sanctuary Center',
  edge: 'Edge Stress',
  neighbor: 'Neighbor Scale',
  mobile: 'Mobile Sanctuary',
}

const round = (value: number) => Number(value.toFixed(4))
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function getDisplayDiff(auto: GameAssetDisplaySpec, draft: GameAssetDisplaySpec) {
  return DISPLAY_FIELDS.reduce<Partial<GameAssetDisplaySpec>>((result, field) => {
    if (Math.abs(auto[field.key] - draft[field.key]) > 0.00005) result[field.key] = round(draft[field.key])
    return result
  }, {})
}

function makeImportedEntry(file: File, url: string, result: ImportedAssetAnalysis): GameAssetStudioEntry {
  return {
    id: '__imported__',
    kind: 'plant',
    slug: file.name.replace(/\.png$/i, ''),
    variant: 'temporary-preview',
    path: url,
    autoDisplay: result.suggestedDisplay,
    display: result.suggestedDisplay,
    analysis: result.analysis,
    checks: result.checks,
  }
}

interface AssetStudioClientProps {
  initialAssets: GameAssetStudioEntry[]
  initialOverrides: Record<string, GameAssetOverride>
}

export function AssetStudioClient({ initialAssets, initialOverrides }: AssetStudioClientProps) {
  const defaultAsset = initialAssets.find((asset) => asset.id === 'plant:cactus:05-mature') ?? initialAssets[0]
  const [assets, setAssets] = useState(initialAssets)
  const [overrides, setOverrides] = useState(initialOverrides)
  const [kind, setKind] = useState<'plant' | 'decoration'>('plant')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(defaultAsset?.id ?? '')
  const [importedAsset, setImportedAsset] = useState<GameAssetStudioEntry | null>(null)
  const [draft, setDraft] = useState<GameAssetDisplaySpec>(defaultAsset?.display ?? {
    anchorX: 0.5, anchorY: 1, scale: 1, offsetX: 0, offsetY: 0,
  })
  const [reason, setReason] = useState(initialOverrides[defaultAsset?.id]?.reason ?? '')
  const [scene, setScene] = useState<ScenePreset>('sanctuary')
  const [viewportKey, setViewportKey] = useState<keyof typeof VIEWPORTS>('desktop')
  const [zoom, setZoom] = useState('1')
  const [renderMode, setRenderMode] = useState<RenderMode>('placed')
  const [showBounds, setShowBounds] = useState(true)
  const [showAnchor, setShowAnchor] = useState(true)
  const [showFootprint, setShowFootprint] = useState(true)
  const [showShadow, setShowShadow] = useState(true)
  const [showSafeFrame, setShowSafeFrame] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const selectedAsset = selectedId === '__imported__'
    ? importedAsset
    : assets.find((asset) => asset.id === selectedId) ?? null

  useEffect(() => () => {
    if (importedAsset?.path.startsWith('blob:')) URL.revokeObjectURL(importedAsset.path)
  }, [importedAsset])

  const visibleAssets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return assets.filter((asset) => asset.kind === kind && (
      !query || asset.slug.includes(query) || asset.variant.includes(query) || asset.id.includes(query)
    ))
  }, [assets, kind, search])

  const stageSiblings = useMemo(() => selectedAsset
    ? assets.filter((asset) => asset.kind === selectedAsset.kind && asset.slug === selectedAsset.slug)
    : [], [assets, selectedAsset])

  const displayDiff = selectedAsset ? getDisplayDiff(selectedAsset.autoDisplay, draft) : {}
  const hasChanges = Object.keys(displayDiff).length > 0
  const isTemporary = selectedAsset?.id === '__imported__'

  const selectAsset = (asset: GameAssetStudioEntry) => {
    setImportedAsset((current) => {
      if (current?.path.startsWith('blob:')) URL.revokeObjectURL(current.path)
      return null
    })
    setKind(asset.kind)
    setSelectedId(asset.id)
    setDraft({ ...asset.display })
    setReason(overrides[asset.id]?.reason ?? '')
    setMessage(null)
  }

  const updateDraft = (field: DisplayField, value: number) => {
    const config = DISPLAY_FIELDS.find((item) => item.key === field)!
    setDraft((current) => ({ ...current, [field]: round(clamp(value, config.min, config.max)) }))
  }

  const saveOverride = async () => {
    if (!selectedAsset || isTemporary || !hasChanges) return
    if (reason.trim().length < 3) {
      setMessage({ type: 'error', text: 'Hãy ghi lý do override, tối thiểu 3 ký tự.' })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/dev/asset-studio/overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          override: { display: displayDiff, reason: reason.trim() },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể lưu override.')
      setAssets((current) => current.map((asset) => asset.id === selectedAsset.id ? result.asset : asset))
      setOverrides((current) => ({ ...current, [selectedAsset.id]: result.override }))
      setDraft({ ...result.asset.display })
      setReason(result.override.reason)
      setMessage({ type: 'success', text: 'Đã lưu override và sinh lại manifest.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể lưu override.' })
    } finally {
      setIsSaving(false)
    }
  }

  const resetOverride = async () => {
    if (!selectedAsset || isTemporary) return
    if (!overrides[selectedAsset.id]) {
      setDraft({ ...selectedAsset.autoDisplay })
      setReason('')
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/dev/asset-studio/overrides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: selectedAsset.id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể reset override.')
      setAssets((current) => current.map((asset) => asset.id === selectedAsset.id ? result.asset : asset))
      setOverrides((current) => {
        const next = { ...current }
        delete next[selectedAsset.id]
        return next
      })
      setDraft({ ...result.asset.display })
      setReason('')
      setMessage({ type: 'success', text: 'Đã trở về metadata tự động.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể reset override.' })
    } finally {
      setIsSaving(false)
    }
  }

  const importPng = async (file: File | undefined) => {
    if (!file) return
    setIsImporting(true)
    setMessage(null)
    const url = URL.createObjectURL(file)
    try {
      const formData = new FormData()
      formData.set('file', file)
      const response = await fetch('/api/dev/asset-studio/analyze', { method: 'POST', body: formData })
      const result = await response.json() as ImportedAssetAnalysis & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Không thể phân tích PNG.')
      if (importedAsset?.path.startsWith('blob:')) URL.revokeObjectURL(importedAsset.path)
      const imported = makeImportedEntry(file, url, result)
      setImportedAsset(imported)
      setSelectedId(imported.id)
      setDraft(imported.display)
      setReason('')
      setMessage({ type: 'success', text: 'PNG đang ở chế độ preview; chưa ghi vào asset library.' })
    } catch (error) {
      URL.revokeObjectURL(url)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể phân tích PNG.' })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <main className="grid min-h-dvh bg-[#e8eddf] text-[#263f22] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="flex min-h-0 flex-col border-r border-[#ccd8c3] bg-[#f8f5eb] lg:h-dvh">
        <div className="border-b border-[#d9e2d2] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#78906d]">Development tool</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Asset Calibration Studio</h1>
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#94aa87] bg-white/70 px-3 py-2 text-sm font-semibold text-[#527047] hover:bg-white">
            <ImagePlus className="h-4 w-4" />
            {isImporting ? 'Đang phân tích…' : 'Preview PNG'}
            <input
              className="sr-only"
              type="file"
              accept="image/png"
              disabled={isImporting}
              onChange={(event) => { void importPng(event.target.files?.[0]); event.currentTarget.value = '' }}
            />
          </label>
        </div>

        <div className="space-y-3 p-4 pb-2">
          <Tabs value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plant">Plants</TabsTrigger>
              <TabsTrigger value="decoration">Decorations</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8d75]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search assets…" />
          </div>
        </div>

        <ScrollArea className="min-h-[320px] flex-1 px-3 pb-4">
          <div className="space-y-1">
            {visibleAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => selectAsset(asset)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition',
                  selectedId === asset.id ? 'bg-[#dfe9d5] ring-1 ring-[#78956d]' : 'hover:bg-white/80'
                )}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/80">
                  <img src={asset.path} alt="" className="h-10 w-10 object-contain" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{asset.slug}</span>
                  <span className="block truncate text-xs text-[#71806b]">{asset.variant}</span>
                </span>
                {overrides[asset.id] && <span className="h-2.5 w-2.5 rounded-full bg-[#d49a3b]" title="Reviewed override" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <section className="min-w-0 p-4 lg:h-dvh lg:overflow-auto lg:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-[#fffaf0]/90 p-3 shadow-sm">
            <Select value={scene} onValueChange={(value) => setScene(value as ScenePreset)}>
              <SelectTrigger aria-label="Scene preset" className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(SCENES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={viewportKey} onValueChange={(value) => setViewportKey(value as keyof typeof VIEWPORTS)}>
              <SelectTrigger aria-label="Preview viewport" className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(VIEWPORTS).map(([value, viewport]) => <SelectItem key={value} value={value}>{viewport.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={zoom} onValueChange={setZoom}>
              <SelectTrigger aria-label="Preview zoom" className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="1">100%</SelectItem><SelectItem value="1.5">150%</SelectItem><SelectItem value="2.5">250%</SelectItem></SelectContent>
            </Select>
            <Select value={renderMode} onValueChange={(value) => setRenderMode(value as RenderMode)}>
              <SelectTrigger aria-label="Render mode" className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="placed">Placed</SelectItem><SelectItem value="ghost">Ghost</SelectItem></SelectContent>
            </Select>
          </div>

          {stageSiblings.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {stageSiblings.map((asset) => (
                <Button key={asset.id} size="sm" variant={asset.id === selectedId ? 'default' : 'outline'} onClick={() => selectAsset(asset)}>
                  {asset.variant.replace(/^\d+-/, '')}
                </Button>
              ))}
            </div>
          )}

          {selectedAsset ? (
            <AssetPreview
              asset={selectedAsset}
              display={draft}
              scene={scene}
              viewport={VIEWPORTS[viewportKey]}
              zoom={Number(zoom)}
              renderMode={renderMode}
              overlays={{ showBounds, showAnchor, showFootprint, showShadow, showSafeFrame }}
              onAnchorChange={(anchorX, anchorY) => setDraft((current) => ({ ...current, anchorX, anchorY }))}
            />
          ) : <div className="grid h-96 place-items-center rounded-3xl bg-white/60">No asset selected</div>}

          <div className="grid gap-3 rounded-2xl border border-white/70 bg-[#fffaf0]/90 p-4 sm:grid-cols-5">
            <OverlayToggle label="Bounds" checked={showBounds} onCheckedChange={setShowBounds} />
            <OverlayToggle label="Anchor" checked={showAnchor} onCheckedChange={setShowAnchor} />
            <OverlayToggle label="Footprint" checked={showFootprint} onCheckedChange={setShowFootprint} />
            <OverlayToggle label="Shadow" checked={showShadow} onCheckedChange={setShowShadow} />
            <OverlayToggle label="Safe frame" checked={showSafeFrame} onCheckedChange={setShowSafeFrame} />
          </div>
        </div>
      </section>

      <aside className="border-l border-[#ccd8c3] bg-[#f8f5eb] p-4 lg:h-dvh lg:overflow-auto">
        {selectedAsset && (
          <div className="space-y-5">
            <div>
              <p className="truncate font-mono text-xs text-[#71806b]">{selectedAsset.id}</p>
              <h2 className="mt-1 text-lg font-semibold">Calibration Inspector</h2>
              {isTemporary && <p className="mt-2 rounded-lg bg-[#fff0cf] p-2 text-xs text-[#7a5922]">Temporary preview cannot be saved until it has a canonical asset ID.</p>}
            </div>

            <div className="space-y-3">
              {DISPLAY_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-[1fr_88px] items-center gap-3">
                  <div>
                    <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                    <p className="mt-0.5 text-[11px] text-[#7b8a75]">Auto {selectedAsset.autoDisplay[field.key].toFixed(field.step < 0.01 ? 3 : 2)}</p>
                  </div>
                  <Input
                    id={`field-${field.key}`}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={draft[field.key]}
                    onChange={(event) => updateDraft(field.key, Number(event.target.value))}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-white/70 p-3 text-xs">
              <div className="flex justify-between"><span>Canvas</span><strong>{selectedAsset.analysis.width}×{selectedAsset.analysis.height}</strong></div>
              <div className="mt-1 flex justify-between"><span>Alpha coverage</span><strong>{Math.round(selectedAsset.analysis.alphaCoverage * 100)}%</strong></div>
              <div className="mt-1 flex justify-between"><span>Override fields</span><strong>{Object.keys(displayDiff).length}</strong></div>
            </div>

            <div className="space-y-2">
              {selectedAsset.checks.map((check) => (
                <div key={check.code} className={cn('flex gap-2 rounded-lg p-2 text-xs', check.level === 'error' ? 'bg-red-50 text-red-800' : check.level === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800')}>
                  {check.level === 'pass' ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  {check.message}
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="override-reason">Override reason</Label>
              <Textarea id="override-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" maxLength={200} placeholder="Why is manual calibration needed?" />
            </div>

            {message && <p className={cn('rounded-xl p-3 text-sm', message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800')}>{message.text}</p>}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => void resetOverride()} disabled={isSaving || isTemporary}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button onClick={() => void saveOverride()} disabled={isSaving || isTemporary || !hasChanges} className="bg-[#56734d] hover:bg-[#46633f]">
                <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </aside>
    </main>
  )
}

function OverlayToggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-2"><Label className="text-xs">{label}</Label><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>
}

function AssetPreview({
  asset,
  display,
  scene,
  viewport,
  zoom,
  renderMode,
  overlays,
  onAnchorChange,
}: {
  asset: GameAssetStudioEntry
  display: GameAssetDisplaySpec
  scene: ScenePreset
  viewport: { width: number; height: number; label: string }
  zoom: number
  renderMode: RenderMode
  overlays: { showBounds: boolean; showAnchor: boolean; showFootprint: boolean; showShadow: boolean; showSafeFrame: boolean }
  onAnchorChange: (x: number, y: number) => void
}) {
  const sourceRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const frameScale = Math.min(1, 820 / viewport.width, 620 / viewport.height)
  const frameWidth = viewport.width * frameScale
  const frameHeight = viewport.height * frameScale
  const rawTileSize = viewport.width < 640 ? 132 : 140
  const tileSize = rawTileSize * frameScale
  const footprint = asset.kind === 'decoration' && asset.slug.includes('pond') ? 2 : 1
  const rawArtSize = asset.kind === 'plant' ? 64 : getDecorationPixelSize(rawTileSize, footprint)
  const artSize = rawArtSize * frameScale * zoom
  const edgeScene = scene === 'edge'
  const contactX = (edgeScene ? 0.13 : 0.5) * frameWidth
  const contactY = (edgeScene ? 0.31 : scene === 'alpha' ? 0.68 : 0.58) * frameHeight
  const groundedStyle = getGroundedArtTransform(display)
  const offsetStyle = getTileOffsetTransform(display, tileSize)
  const safeInsets = getSanctuarySafeInsets(viewport.width)
  const checker = 'linear-gradient(45deg,#eef0ea 25%,transparent 25%),linear-gradient(-45deg,#eef0ea 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eef0ea 75%),linear-gradient(-45deg,transparent 75%,#eef0ea 75%)'

  const updateAnchor = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = sourceRef.current?.getBoundingClientRect()
    if (!rect) return
    onAnchorChange(
      round(clamp((event.clientX - rect.left) / rect.width, 0, 1)),
      round(clamp((event.clientY - rect.top) / rect.height, 0, 1))
    )
  }

  return (
    <div className="overflow-auto rounded-3xl border border-white/80 bg-[#dfe6d7] p-4 shadow-inner">
      <div
        data-testid="asset-studio-preview"
        className="relative mx-auto overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(44,70,39,0.2)]"
        style={{
          width: frameWidth,
          height: frameHeight,
          backgroundColor: scene === 'alpha' ? '#fbf5e6' : '#b7c8ad',
          backgroundImage: scene === 'alpha'
            ? checker
            : `linear-gradient(rgba(255,255,255,.04),rgba(255,255,255,.04)),url(/garden/backgrounds/sanctuary-golden-hour.webp)`,
          backgroundSize: scene === 'alpha' ? '20px 20px' : 'cover',
          backgroundPosition: scene === 'alpha' ? '0 0,0 10px,10px -10px,-10px 0' : 'center',
        }}
      >
        {overlays.showSafeFrame && scene !== 'alpha' && (
          <div
            className="pointer-events-none absolute border border-dashed border-cyan-300/90 bg-cyan-200/5"
            style={{
              left: safeInsets.left * frameScale,
              right: safeInsets.right * frameScale,
              top: safeInsets.top * frameScale,
              bottom: safeInsets.bottom * frameScale,
            }}
          />
        )}

        {scene !== 'alpha' && <div className="absolute inset-x-[7%] top-[31%] h-[43%] rotate-0 rounded-[46%] bg-[#496744]/88 shadow-[0_22px_28px_rgba(52,56,39,.3)]" />}

        {overlays.showFootprint && (
          <svg className="pointer-events-none absolute overflow-visible" style={{ left: contactX - tileSize / 2, top: contactY - tileSize / 4 }} width={tileSize} height={tileSize / 2} viewBox={`0 0 ${tileSize} ${tileSize / 2}`}>
            <polygon points={`${tileSize / 2},0 ${tileSize},${tileSize / 4} ${tileSize / 2},${tileSize / 2} 0,${tileSize / 4}`} fill="rgba(202,232,180,.15)" stroke="rgba(224,255,215,.9)" strokeWidth="2" />
          </svg>
        )}

        {overlays.showShadow && <div className="absolute rounded-full bg-black/25 blur-[3px]" style={{ left: contactX - tileSize * 0.24, top: contactY - tileSize * 0.05, width: tileSize * 0.48, height: tileSize * 0.12 }} />}

        {scene === 'neighbor' && <img src="/garden/decorations/sanctuary-rock-lantern.png" alt="Scale reference" className="absolute object-contain opacity-90" style={{ width: tileSize * 1.24, height: tileSize * 1.24, left: contactX + tileSize * 0.6, top: contactY - tileSize * 1.05 }} />}

        <div
          className={cn('absolute', renderMode === 'ghost' && 'opacity-65')}
          style={{ left: contactX - artSize / 2, top: contactY - artSize, width: artSize, height: artSize, ...offsetStyle }}
          data-testid="asset-offset-wrapper"
        >
          <div
            ref={sourceRef}
            className="relative h-full w-full touch-none"
            style={groundedStyle}
            onPointerDown={(event) => {
              draggingRef.current = true
              event.currentTarget.setPointerCapture(event.pointerId)
              updateAnchor(event)
            }}
            onPointerMove={(event) => { if (draggingRef.current) updateAnchor(event) }}
            onPointerUp={() => { draggingRef.current = false }}
            onPointerCancel={() => { draggingRef.current = false }}
          >
            <img src={asset.path} alt={`${asset.slug} ${asset.variant}`} draggable={false} className="h-full w-full select-none object-contain" />
            {overlays.showBounds && (
              <div className="pointer-events-none absolute border-2 border-fuchsia-400/90 bg-fuchsia-300/5" style={{
                left: `${asset.analysis.bounds.left * 100}%`,
                top: `${asset.analysis.bounds.top * 100}%`,
                width: `${(asset.analysis.bounds.right - asset.analysis.bounds.left) * 100}%`,
                height: `${(asset.analysis.bounds.bottom - asset.analysis.bounds.top) * 100}%`,
              }} />
            )}
            {overlays.showAnchor && (
              <div className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500 shadow" style={{ left: `${display.anchorX * 100}%`, top: `${display.anchorY * 100}%` }} />
            )}
          </div>
        </div>

        <div className="absolute bottom-2 right-3 rounded-full bg-[#fffaf0]/80 px-2 py-1 text-[10px] font-semibold text-[#49633f] backdrop-blur">{viewport.label} · {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  )
}
