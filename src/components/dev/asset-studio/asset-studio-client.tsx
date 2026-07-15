'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Focus,
  Grid3X3,
  ImagePlus,
  Maximize2,
  RotateCcw,
  Save,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroundPlaneCanvas } from '@/components/garden/ground-plane-canvas'
import { getGroundPlaneHeight } from '@/components/garden/ground-plane-geometry'
import { getGroundedArtTransform, getTileOffsetTransform } from '@/lib/assets/game-asset-display'
import {
  getGardenEntityRenderMetrics,
  getGardenTileSize,
} from '@/lib/assets/game-asset-render-metrics'
import {
  resolveGameAssetDisplay,
  toFootprintKey,
  type GameAssetDisplaySpec,
} from '@/lib/assets/game-asset-contract'
import type {
  GameAssetCatalogDocument,
  GameAssetOverride,
  GameAssetStudioEntry,
  ImportedAssetAnalysis,
} from '@/lib/assets/asset-studio-types'
import { getEntityShadowBounds, getSanctuarySafeInsets } from '@/lib/garden/camera-safe-area'
import { cn } from '@/lib/utils'

type DisplayField = keyof GameAssetDisplaySpec
type PositionPreset = 'center' | 'edge' | 'corner'

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

const round = (value: number) => Number(value.toFixed(4))
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function getDisplayDiff(base: GameAssetDisplaySpec, draft: GameAssetDisplaySpec) {
  return DISPLAY_FIELDS.reduce<Partial<GameAssetDisplaySpec>>((result, field) => {
    if (Math.abs(base[field.key] - draft[field.key]) > 0.00005) result[field.key] = round(draft[field.key])
    return result
  }, {})
}

function displaysEqual(left: GameAssetDisplaySpec, right: GameAssetDisplaySpec) {
  return DISPLAY_FIELDS.every((field) => Math.abs(left[field.key] - right[field.key]) <= 0.00005)
}

function getDefaultFootprint(asset: GameAssetStudioEntry) {
  if (asset.kind === 'decoration') return asset.canonicalFootprint ?? 1
  return asset.variant.startsWith('05-') ? 2 : 1
}

function getStageGrowth(variant: string) {
  if (variant.startsWith('01-')) return 5
  if (variant.startsWith('02-')) return 17
  if (variant.startsWith('03-')) return 50
  if (variant.startsWith('04-')) return 87
  return 100
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

interface ProfileDraft {
  display: GameAssetDisplaySpec
  reason: string
}

interface AssetStudioClientProps {
  initialAssets: GameAssetStudioEntry[]
  initialOverrides: Record<string, GameAssetOverride>
  initialCatalog?: GameAssetCatalogDocument
}

export function AssetStudioClient({
  initialAssets,
  initialOverrides,
  initialCatalog = { schemaVersion: 1, decorations: {} },
}: AssetStudioClientProps) {
  const defaultAsset = initialAssets.find((asset) => asset.id === 'plant:cactus:05-mature') ?? initialAssets[0]
  const [assets, setAssets] = useState(initialAssets)
  const [overrides, setOverrides] = useState(initialOverrides)
  const [catalog, setCatalog] = useState(initialCatalog)
  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, number>>({})
  const [profileDrafts, setProfileDrafts] = useState<Record<string, ProfileDraft>>({})
  const [kind, setKind] = useState<'plant' | 'decoration'>('plant')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(defaultAsset?.id ?? '')
  const [footprint, setFootprint] = useState(defaultAsset ? getDefaultFootprint(defaultAsset) : 1)
  const [growthPercentage, setGrowthPercentage] = useState(defaultAsset ? getStageGrowth(defaultAsset.variant) : 100)
  const [importedAsset, setImportedAsset] = useState<GameAssetStudioEntry | null>(null)
  const [editorZoom, setEditorZoom] = useState('fit')
  const [viewportKey, setViewportKey] = useState<keyof typeof VIEWPORTS>('desktop')
  const [showBounds, setShowBounds] = useState(true)
  const [showAnchor, setShowAnchor] = useState(true)
  const [showShadow, setShowShadow] = useState(true)
  const [showSafeFrame, setShowSafeFrame] = useState(true)
  const [showNeighbors, setShowNeighbors] = useState(true)
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

  const profileKey = selectedAsset ? `${selectedAsset.id}@${footprint}` : ''
  const storedProfile = selectedAsset
    ? overrides[selectedAsset.id]?.profiles?.[toFootprintKey(footprint)]
    : undefined
  const storedDisplay = selectedAsset
    ? resolveGameAssetDisplay(selectedAsset, footprint)
    : { anchorX: 0.5, anchorY: 1, scale: 1, offsetX: 0, offsetY: 0 }
  const draft = profileDrafts[profileKey] ?? { display: storedDisplay, reason: storedProfile?.reason ?? '' }
  const profilePayload = selectedAsset ? getDisplayDiff(selectedAsset.display, draft.display) : {}
  const currentCanonical = selectedAsset?.kind === 'decoration'
    ? catalog.decorations[selectedAsset.slug]?.canonicalFootprint ?? selectedAsset.canonicalFootprint ?? 1
    : undefined
  const draftCanonical = selectedAsset?.kind === 'decoration'
    ? catalogDrafts[selectedAsset.slug] ?? currentCanonical
    : undefined
  const profileDirty = Boolean(selectedAsset) && (
    !displaysEqual(storedDisplay, draft.display) || (storedProfile?.reason ?? '') !== draft.reason
  )
  const canonicalDirty = draftCanonical !== currentCanonical
  const hasChanges = profileDirty || canonicalDirty
  const isTemporary = selectedAsset?.id === '__imported__'

  const writeDraft = (next: Partial<ProfileDraft> & { display?: GameAssetDisplaySpec }) => {
    if (!profileKey) return
    setProfileDrafts((current) => ({
      ...current,
      [profileKey]: { ...draft, ...next },
    }))
  }

  const updateDisplay = (nextDisplay: GameAssetDisplaySpec) => writeDraft({ display: nextDisplay })

  const updateField = (field: DisplayField, value: number) => {
    const config = DISPLAY_FIELDS.find((item) => item.key === field)!
    updateDisplay({ ...draft.display, [field]: round(clamp(value, config.min, config.max)) })
  }

  const selectAsset = (asset: GameAssetStudioEntry) => {
    setImportedAsset((current) => {
      if (current?.path.startsWith('blob:')) URL.revokeObjectURL(current.path)
      return null
    })
    setKind(asset.kind)
    setSelectedId(asset.id)
    setFootprint(getDefaultFootprint(asset))
    setGrowthPercentage(getStageGrowth(asset.variant))
    setMessage(null)
  }

  const saveProfile = async () => {
    if (!selectedAsset || isTemporary || !hasChanges) return
    if (draft.reason.trim().length < 3) {
      setMessage({ type: 'error', text: 'Hãy ghi lý do thay đổi, tối thiểu 3 ký tự.' })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const resetProfile = Object.keys(profilePayload).length === 0 && Boolean(storedProfile)
      const response = await fetch('/api/dev/asset-studio/overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          footprint,
          display: Object.keys(profilePayload).length ? profilePayload : undefined,
          reason: draft.reason.trim(),
          resetProfile,
          canonicalFootprint: canonicalDirty ? draftCanonical : undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể lưu profile.')
      setAssets((current) => current.map((asset) => asset.id === selectedAsset.id ? result.asset : asset))
      setOverrides((current) => {
        const next = { ...current }
        if (result.override) next[selectedAsset.id] = result.override
        else delete next[selectedAsset.id]
        return next
      })
      if (result.catalog) setCatalog(result.catalog)
      setCatalogDrafts((current) => {
        const next = { ...current }
        delete next[selectedAsset.slug]
        return next
      })
      setProfileDrafts((current) => {
        const next = { ...current }
        delete next[profileKey]
        return next
      })
      setMessage({
        type: 'success',
        text: result.migrationPath
          ? `Đã lưu profile và tạo migration ${result.migrationPath}.`
          : 'Đã lưu profile và sinh lại manifest.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể lưu profile.' })
    } finally {
      setIsSaving(false)
    }
  }

  const resetProfile = async () => {
    if (!selectedAsset || isTemporary) return
    if (!storedProfile) {
      setProfileDrafts((current) => {
        const next = { ...current }
        delete next[profileKey]
        return next
      })
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch('/api/dev/asset-studio/overrides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: selectedAsset.id, footprint }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể reset profile.')
      setAssets((current) => current.map((asset) => asset.id === selectedAsset.id ? result.asset : asset))
      setOverrides((current) => {
        const next = { ...current }
        if (result.override) next[selectedAsset.id] = result.override
        else delete next[selectedAsset.id]
        return next
      })
      setProfileDrafts((current) => {
        const next = { ...current }
        delete next[profileKey]
        return next
      })
      setMessage({ type: 'success', text: `Đã reset visual profile ${footprint}×${footprint}.` })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể reset profile.' })
    } finally {
      setIsSaving(false)
    }
  }

  const resetAllProfiles = async () => {
    if (!selectedAsset || isTemporary || !overrides[selectedAsset.id]) return
    if (!window.confirm(`Reset toàn bộ visual override của ${selectedAsset.slug}?`)) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/dev/asset-studio/overrides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: selectedAsset.id, resetAll: true }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Không thể reset toàn bộ profile.')
      setAssets((current) => current.map((asset) => asset.id === selectedAsset.id ? result.asset : asset))
      setOverrides((current) => {
        const next = { ...current }
        delete next[selectedAsset.id]
        return next
      })
      setProfileDrafts((current) => Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`${selectedAsset.id}@`))
      ))
      setMessage({ type: 'success', text: 'Đã reset toàn bộ visual override của asset.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể reset toàn bộ profile.' })
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
      setFootprint(1)
      setGrowthPercentage(100)
      setMessage({ type: 'success', text: 'PNG đang ở chế độ preview; chưa ghi vào asset library.' })
    } catch (error) {
      URL.revokeObjectURL(url)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Không thể phân tích PNG.' })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <main className="grid min-h-dvh bg-[#e8eddf] text-[#263f22] lg:grid-cols-[270px_minmax(0,1fr)_320px]">
      <aside className="flex min-h-0 flex-col border-r border-[#ccd8c3] bg-[#f8f5eb] lg:h-dvh">
        <div className="border-b border-[#d9e2d2] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#78906d]">Development tool</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Asset Calibration Studio</h1>
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#94aa87] bg-white/70 px-3 py-2 text-sm font-semibold text-[#527047] hover:bg-white">
            <ImagePlus className="h-4 w-4" />
            {isImporting ? 'Đang phân tích…' : 'Preview PNG'}
            <input className="sr-only" type="file" accept="image/png" disabled={isImporting}
              onChange={(event) => { void importPng(event.target.files?.[0]); event.currentTarget.value = '' }} />
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
        <ScrollArea className="h-[22rem] min-h-0 flex-none px-3 pb-4 lg:h-auto lg:min-h-[320px] lg:flex-1">
          <div className="space-y-1">
            {visibleAssets.map((asset) => (
              <button key={asset.id} type="button" onClick={() => selectAsset(asset)}
                className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition',
                  selectedId === asset.id ? 'bg-[#dfe9d5] ring-1 ring-[#78956d]' : 'hover:bg-white/80')}>
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
            <>
              <section className="rounded-3xl border border-white/80 bg-[#f7f4e9]/95 p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#78906d]">Primary workspace</p>
                    <h2 className="mt-1 text-xl font-semibold">Calibration Bench</h2>
                    <p className="mt-1 text-sm text-[#71806b]">Chỉnh asset theo footprint; toàn bộ bench giữ nguyên tỷ lệ production.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={editorZoom} onValueChange={setEditorZoom}>
                      <SelectTrigger aria-label="Editor zoom" className="w-[118px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit</SelectItem><SelectItem value="1">100%</SelectItem>
                        <SelectItem value="1.5">150%</SelectItem><SelectItem value="2.5">250%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/65 p-3">
                  <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-[#65775f]"><Grid3X3 className="h-4 w-4" /> Footprint</span>
                  {(selectedAsset.kind === 'plant' ? [1, 2, 3, 4] : Array.from({ length: Math.max(4, draftCanonical ?? 1) }, (_, index) => index + 1)).map((size) => (
                    <Button key={size} size="sm" variant={footprint === size ? 'default' : 'outline'} onClick={() => setFootprint(size)}>
                      {size}×{size}
                    </Button>
                  ))}
                  {selectedAsset.kind === 'decoration' && (
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#65775f]">
                      Custom
                      <Input aria-label="Custom decoration footprint" type="number" min={1} step={1} value={footprint}
                        onChange={(event) => setFootprint(Math.max(1, Math.floor(Number(event.target.value) || 1)))} className="h-8 w-16" />
                    </label>
                  )}
                  {selectedAsset.kind === 'decoration' && (
                    draftCanonical === footprint
                      ? <span className="ml-auto rounded-full bg-[#dfe9d5] px-3 py-1.5 text-xs font-semibold text-[#527047]">Canonical</span>
                      : <Button className="ml-auto" size="sm" variant="outline" onClick={() => setCatalogDrafts((current) => ({ ...current, [selectedAsset.slug]: footprint }))}>Đặt làm canonical</Button>
                  )}
                  {selectedAsset.kind === 'plant' && (
                    <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-[#65775f]">
                      Growth
                      <Input aria-label="Growth percentage" type="number" min={0} max={100} value={growthPercentage}
                        onChange={(event) => setGrowthPercentage(clamp(Number(event.target.value), 0, 100))} className="h-8 w-20" />
                    </label>
                  )}
                </div>

                <CalibrationBench asset={selectedAsset} display={draft.display} footprint={footprint}
                  growthPercentage={growthPercentage} zoom={editorZoom === 'fit' ? 1 : Number(editorZoom)}
                  overlays={{ showBounds, showAnchor, showShadow }} onDisplayChange={updateDisplay} />

                <div className="mt-4 grid gap-3 rounded-2xl bg-white/65 p-3 sm:grid-cols-3">
                  <OverlayToggle label="Alpha bounds" checked={showBounds} onCheckedChange={setShowBounds} />
                  <OverlayToggle label="Contact anchor" checked={showAnchor} onCheckedChange={setShowAnchor} />
                  <OverlayToggle label="Production shadow" checked={showShadow} onCheckedChange={setShowShadow} />
                </div>
              </section>

              <details className="group rounded-3xl border border-white/80 bg-[#f7f4e9]/95 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#78906d]">Final check</p>
                    <h2 className="mt-1 text-xl font-semibold">Production Sandbox</h2>
                    <p className="mt-1 text-sm text-[#71806b]">Đặt thử asset lên garden thật sau khi calibration.</p>
                  </div>
                  <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-[#dce3d6] p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Select value={viewportKey} onValueChange={(value) => setViewportKey(value as keyof typeof VIEWPORTS)}>
                      <SelectTrigger aria-label="Preview viewport" className="w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(VIEWPORTS).map(([value, viewport]) => <SelectItem key={value} value={value}>{viewport.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <OverlayToggle label="Safe frame" checked={showSafeFrame} onCheckedChange={setShowSafeFrame} />
                    <OverlayToggle label="Neighbors" checked={showNeighbors} onCheckedChange={setShowNeighbors} />
                  </div>
                  <ProductionSandbox asset={selectedAsset} display={draft.display} footprint={footprint}
                    growthPercentage={growthPercentage} viewport={VIEWPORTS[viewportKey]}
                    showSafeFrame={showSafeFrame} showNeighbors={showNeighbors} />
                </div>
              </details>
            </>
          ) : <div className="grid h-96 place-items-center rounded-3xl bg-white/60">No asset selected</div>}
        </div>
      </section>

      <aside className="border-l border-[#ccd8c3] bg-[#f8f5eb] p-4 lg:h-dvh lg:overflow-auto">
        {selectedAsset && (
          <div className="space-y-5">
            <div>
              <p className="truncate font-mono text-xs text-[#71806b]">{selectedAsset.id}</p>
              <h2 className="mt-1 text-lg font-semibold">Calibration Inspector</h2>
              <p className="mt-1 text-xs text-[#71806b]">Profile {footprint}×{footprint}</p>
              {isTemporary && <p className="mt-2 rounded-lg bg-[#fff0cf] p-2 text-xs text-[#7a5922]">Temporary preview cannot be saved until it has a canonical asset ID.</p>}
            </div>

            <div className="space-y-3">
              {DISPLAY_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-[1fr_88px] items-center gap-3">
                  <div>
                    <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                    <p className="mt-0.5 text-[11px] text-[#7b8a75]">Base {selectedAsset.display[field.key].toFixed(field.step < 0.01 ? 3 : 2)}</p>
                  </div>
                  <Input id={`field-${field.key}`} aria-label={field.label} type="number" min={field.min} max={field.max}
                    step={field.step} value={draft.display[field.key]} onChange={(event) => updateField(field.key, Number(event.target.value))} />
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-white/70 p-3 text-xs">
              <div className="flex justify-between"><span>Canvas</span><strong>{selectedAsset.analysis.width}×{selectedAsset.analysis.height}</strong></div>
              <div className="mt-1 flex justify-between"><span>Alpha coverage</span><strong>{Math.round(selectedAsset.analysis.alphaCoverage * 100)}%</strong></div>
              <div className="mt-1 flex justify-between"><span>Profile fields</span><strong>{Object.keys(profilePayload).length}</strong></div>
              {selectedAsset.kind === 'decoration' && <div className="mt-1 flex justify-between"><span>Canonical</span><strong>{draftCanonical}×{draftCanonical}</strong></div>}
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
              <Textarea id="override-reason" aria-label="Override reason" value={draft.reason}
                onChange={(event) => writeDraft({ reason: event.target.value })} className="mt-2" maxLength={200}
                placeholder="Why is this footprint profile needed?" />
            </div>

            {message && <p className={cn('rounded-xl p-3 text-sm', message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800')}>{message.text}</p>}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => void resetProfile()} disabled={isSaving || isTemporary}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset profile
              </Button>
              <Button onClick={() => void saveProfile()} disabled={isSaving || isTemporary || !hasChanges} className="bg-[#56734d] hover:bg-[#46633f]">
                <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-xs text-[#71806b]" onClick={() => void resetAllProfiles()}
              disabled={isSaving || isTemporary || !overrides[selectedAsset.id]}>Reset all visual profiles</Button>
          </div>
        )}
      </aside>
    </main>
  )
}

function OverlayToggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex min-w-[130px] items-center justify-between gap-3"><Label className="text-xs">{label}</Label><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>
}

function getFootprintCells(footprint: number) {
  return Array.from({ length: footprint * footprint }, (_, index) => ({
    row: Math.floor(index / footprint),
    col: index % footprint,
  }))
}

function CalibrationBench({
  asset,
  display,
  footprint,
  growthPercentage,
  zoom,
  overlays,
  onDisplayChange,
}: {
  asset: GameAssetStudioEntry
  display: GameAssetDisplaySpec
  footprint: number
  growthPercentage: number
  zoom: number
  overlays: { showBounds: boolean; showAnchor: boolean; showShadow: boolean }
  onDisplayChange: (display: GameAssetDisplaySpec) => void
}) {
  const tileSize = 140
  const logicalWidth = Math.max(720, footprint * tileSize + 180)
  const logicalHeight = Math.max(470, footprint * tileSize / 2 + 250)
  const originX = logicalWidth / 2
  const originY = 96
  const contactX = originX
  const contactY = originY + footprint * tileSize / 4
  const sceneFit = Math.min(1, 760 / logicalWidth, 520 / logicalHeight)
  const scale = sceneFit * zoom
  const shadow = getEntityShadowBounds(contactX, contactY, tileSize, footprint, asset.kind)

  return (
    <div className="mt-4 overflow-auto rounded-2xl border border-[#d5dfcf] bg-[#e4eadf] p-3 shadow-inner" data-testid="asset-studio-preview">
      <div className="relative mx-auto" style={{ width: logicalWidth * scale, height: logicalHeight * scale }}>
        <div className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-2xl"
          style={{ width: logicalWidth, height: logicalHeight, transform: `scale(${scale})`,
            backgroundColor: '#f8f4e8',
            backgroundImage: 'linear-gradient(45deg,#e8ece4 25%,transparent 25%),linear-gradient(-45deg,#e8ece4 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e8ece4 75%),linear-gradient(-45deg,transparent 75%,#e8ece4 75%)',
            backgroundSize: '24px 24px', backgroundPosition: '0 0,0 12px,12px -12px,-12px 0' }}>
          <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-[#fffaf0]/90 px-3 py-1 text-xs font-semibold text-[#5f7359] shadow-sm">
            Desktop logical tile · {tileSize}px · {footprint}×{footprint}
          </div>
          {getFootprintCells(footprint).map(({ row, col }) => {
            const x = originX + (col - row) * tileSize / 2
            const y = originY + (col + row) * tileSize / 4
            return <svg key={`${row}-${col}`} data-testid="footprint-cell" className="absolute overflow-visible" style={{ left: x - tileSize / 2, top: y }}
              width={tileSize} height={tileSize / 2} viewBox={`0 0 ${tileSize} ${tileSize / 2}`}>
              <polygon points={`${tileSize / 2},0 ${tileSize},${tileSize / 4} ${tileSize / 2},${tileSize / 2} 0,${tileSize / 4}`}
                fill={row === 0 && col === 0 ? 'rgba(231,190,93,.28)' : 'rgba(123,157,105,.16)'}
                stroke={row === 0 && col === 0 ? '#d39a32' : '#78956d'} strokeWidth="1.5" />
            </svg>
          })}
          {overlays.showShadow && <div className="absolute rounded-full bg-black/20 blur-[4px]"
            style={{ left: shadow.left, top: shadow.top, width: shadow.right - shadow.left, height: shadow.bottom - shadow.top }} />}
          <GroundedPreviewArt asset={asset} display={display} footprint={footprint} growthPercentage={growthPercentage}
            tileSize={tileSize} contactX={contactX} contactY={contactY} showBounds={overlays.showBounds}
            showAnchor={overlays.showAnchor} onDisplayChange={onDisplayChange} interactive />
          <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#d39a32] shadow"
            style={{ left: contactX, top: contactY }} title="Garden contact point" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-[#35523c]/90 px-3 py-2 text-center text-[11px] text-white shadow">
            Kéo asset để chỉnh offset · kéo chấm đỏ để chỉnh anchor · phím mũi tên để nudge
          </div>
        </div>
      </div>
    </div>
  )
}

function GroundedPreviewArt({
  asset,
  display,
  footprint,
  growthPercentage,
  tileSize,
  contactX,
  contactY,
  showBounds = false,
  showAnchor = false,
  interactive = false,
  opacity = 1,
  onDisplayChange,
}: {
  asset: GameAssetStudioEntry
  display: GameAssetDisplaySpec
  footprint: number
  growthPercentage: number
  tileSize: number
  contactX: number
  contactY: number
  showBounds?: boolean
  showAnchor?: boolean
  interactive?: boolean
  opacity?: number
  onDisplayChange?: (display: GameAssetDisplaySpec) => void
}) {
  const artRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const metrics = getGardenEntityRenderMetrics({ kind: asset.kind, tileSize, footprint, growthPercentage })
  const groundedStyle = getGroundedArtTransform(display)
  const offsetStyle = getTileOffsetTransform(display, tileSize)

  const updateAnchor = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = artRef.current?.getBoundingClientRect()
    if (!rect || !onDisplayChange) return
    onDisplayChange({
      ...display,
      anchorX: round(clamp((event.clientX - rect.left) / rect.width, 0, 1)),
      anchorY: round(clamp((event.clientY - rect.top) / rect.height, 0, 1)),
    })
  }

  return (
    <div className="absolute" data-testid="asset-offset-wrapper" tabIndex={interactive ? 0 : -1}
      aria-label={interactive ? `Di chuyển ${asset.slug} trong footprint` : undefined}
      style={{ left: contactX - metrics.artSize / 2, top: contactY - metrics.artSize,
        width: metrics.artSize, height: metrics.artSize, opacity, ...offsetStyle }}
      onPointerDown={interactive ? (event) => {
        dragRef.current = { x: event.clientX, y: event.clientY, offsetX: display.offsetX, offsetY: display.offsetY }
        event.currentTarget.setPointerCapture(event.pointerId)
      } : undefined}
      onPointerMove={interactive ? (event) => {
        if (!dragRef.current || !onDisplayChange) return
        onDisplayChange({ ...display,
          offsetX: round(clamp(dragRef.current.offsetX + (event.clientX - dragRef.current.x) / tileSize, -0.5, 0.5)),
          offsetY: round(clamp(dragRef.current.offsetY + (event.clientY - dragRef.current.y) / tileSize, -0.5, 0.5)) })
      } : undefined}
      onPointerUp={interactive ? () => { dragRef.current = null } : undefined}
      onPointerCancel={interactive ? () => { dragRef.current = null } : undefined}
      onKeyDown={interactive ? (event) => {
        if (!onDisplayChange || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.preventDefault()
        const step = event.shiftKey ? 0.05 : 0.01
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        onDisplayChange({ ...display,
          offsetX: round(clamp(display.offsetX + dx, -0.5, 0.5)),
          offsetY: round(clamp(display.offsetY + dy, -0.5, 0.5)) })
      } : undefined}>
      <div ref={artRef} className="relative h-full w-full touch-none" style={groundedStyle}>
        <img src={asset.path} alt={`${asset.slug} ${asset.variant}`} draggable={false} className="h-full w-full select-none object-contain" />
        {showBounds && <div className="pointer-events-none absolute border-2 border-fuchsia-400/90 bg-fuchsia-300/5" style={{
          left: `${asset.analysis.bounds.left * 100}%`, top: `${asset.analysis.bounds.top * 100}%`,
          width: `${(asset.analysis.bounds.right - asset.analysis.bounds.left) * 100}%`,
          height: `${(asset.analysis.bounds.bottom - asset.analysis.bounds.top) * 100}%`,
        }} />}
        {showAnchor && <div data-anchor-handle="true" className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-white bg-red-500 shadow"
          style={{ left: `${display.anchorX * 100}%`, top: `${display.anchorY * 100}%` }}
          onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); updateAnchor(event) }}
          onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateAnchor(event) }} />}
      </div>
    </div>
  )
}

function ProductionSandbox({
  asset,
  display,
  footprint,
  growthPercentage,
  viewport,
  showSafeFrame,
  showNeighbors,
}: {
  asset: GameAssetStudioEntry
  display: GameAssetDisplaySpec
  footprint: number
  growthPercentage: number
  viewport: { width: number; height: number; label: string }
  showSafeFrame: boolean
  showNeighbors: boolean
}) {
  const gridSize = Math.max(5, footprint + 2)
  const tileSize = getGardenTileSize(viewport.width, true)
  const groundWidth = gridSize * tileSize
  const groundHeight = getGroundPlaneHeight(gridSize, tileSize, true)
  const groundLeft = (viewport.width - groundWidth) / 2
  const groundTop = viewport.width < 640 ? 260 : 128
  const [position, setPosition] = useState({ row: 1, col: 1 })
  const maxAnchor = Math.max(0, gridSize - footprint)
  const safePosition = { row: clamp(position.row, 0, maxAnchor), col: clamp(position.col, 0, maxAnchor) }
  const contactX = groundLeft + gridSize * tileSize / 2 + (safePosition.col - safePosition.row) * tileSize / 2
  const contactY = groundTop + (safePosition.col + safePosition.row) * tileSize / 4 + tileSize / 4 + (footprint - 1) * tileSize / 4
  const frameScale = Math.min(1, 820 / viewport.width, 560 / viewport.height)
  const insets = getSanctuarySafeInsets(viewport.width)

  const applyPreset = (preset: PositionPreset) => {
    if (preset === 'corner') setPosition({ row: 0, col: 0 })
    else if (preset === 'edge') setPosition({ row: 0, col: Math.floor(maxAnchor / 2) })
    else setPosition({ row: Math.floor(maxAnchor / 2), col: Math.floor(maxAnchor / 2) })
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => applyPreset('center')}><Focus className="mr-1.5 h-4 w-4" /> Center</Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset('edge')}><Maximize2 className="mr-1.5 h-4 w-4" /> Edge</Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset('corner')}><Grid3X3 className="mr-1.5 h-4 w-4" /> Corner</Button>
        <span className="ml-auto text-xs font-semibold text-[#71806b]">Logical {viewport.label} · tile {tileSize}px</span>
      </div>
      <div className="overflow-auto rounded-2xl bg-[#dfe6d7] p-3 shadow-inner" data-testid="asset-studio-sandbox">
        <div className="relative mx-auto" style={{ width: viewport.width * frameScale, height: viewport.height * frameScale }}>
          <div className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-2xl shadow-[0_18px_45px_rgba(44,70,39,.22)]"
            style={{ width: viewport.width, height: viewport.height, transform: `scale(${frameScale})`,
              backgroundImage: 'url(/garden/backgrounds/sanctuary-golden-hour.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {showSafeFrame && <div className="pointer-events-none absolute z-30 border border-dashed border-cyan-300/90 bg-cyan-200/5"
              style={{ left: insets.left, right: insets.right, top: insets.top, bottom: insets.bottom }} />}
            <div className="absolute" style={{ left: groundLeft, top: groundTop, width: groundWidth, height: groundHeight }}>
              <GroundPlaneCanvas gridSize={gridSize} tileSize={tileSize} cinematic showGridLines
                dragTargetCell={safePosition} dragPlantSize={footprint} isDragTargetValid />
              {getFootprintCells(gridSize).map(({ row, col }) => (
                <button key={`${row}-${col}`} type="button" aria-label={`Đặt preview tại ô ${row + 1}, ${col + 1}`}
                  className="absolute z-20 border-0 bg-transparent"
                  style={{ left: gridSize * tileSize / 2 + (col - row) * tileSize / 2 - tileSize / 2,
                    top: (col + row) * tileSize / 4, width: tileSize, height: tileSize / 2 }}
                  onClick={() => setPosition({ row: clamp(row, 0, maxAnchor), col: clamp(col, 0, maxAnchor) })} />
              ))}
            </div>
            {showNeighbors && asset.slug !== 'stone-lantern' && (
              <img src="/garden/decorations/sanctuary-rock-lantern.png" alt="Neighbor scale reference"
                className="absolute object-contain opacity-90" style={{ width: tileSize * 1.86, height: tileSize * 1.86,
                  left: groundLeft + groundWidth * 0.72, top: groundTop + groundHeight * 0.18 }} />
            )}
            <GroundedPreviewArt asset={asset} display={display} footprint={footprint} growthPercentage={growthPercentage}
              tileSize={tileSize} contactX={contactX} contactY={contactY} />
          </div>
        </div>
      </div>
    </div>
  )
}
