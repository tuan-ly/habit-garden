export interface DecorationArtSpec {
  /** Normalized contact point inside the source canvas/emoji box. */
  anchorX: number
  anchorY: number
  scale: number
}

// Emoji values are optical anchors because native glyph canvases do not
// expose alpha bounds. PNG anchors come from the generated asset manifest.
const EMOJI_ART_SPECS: Record<string, DecorationArtSpec> = {
  'stepping-stone': { anchorX: 0.54, anchorY: 0.86, scale: 1 },
  'paper-lantern': { anchorX: 0.54, anchorY: 0.88, scale: 1 },
  'garden-bench': { anchorX: 0.52, anchorY: 0.9, scale: 1 },
}

const DEFAULT_IMAGE_SPEC: DecorationArtSpec = {
  anchorX: 0.5,
  anchorY: 0.86,
  scale: 1.04,
}

const DEFAULT_EMOJI_SPEC: DecorationArtSpec = {
  anchorX: 0.52,
  anchorY: 0.88,
  scale: 1,
}

export function getDecorationArtSpec(slug: string, hasImage: boolean): DecorationArtSpec {
  if (hasImage) return getDecorationAssetSpec(slug)?.display ?? DEFAULT_IMAGE_SPEC
  return EMOJI_ART_SPECS[slug] ?? DEFAULT_EMOJI_SPEC
}

export function getGroundedArtTransform(spec: DecorationArtSpec): React.CSSProperties {
  const translateX = Number(((0.5 - spec.anchorX) * 100).toFixed(4))
  const translateY = Number(((1 - spec.anchorY) * 100).toFixed(4))

  return {
    transform: `translate(${translateX}%, ${translateY}%) scale(${spec.scale})`,
    transformOrigin: `${spec.anchorX * 100}% ${spec.anchorY * 100}%`,
  }
}
import { getDecorationAssetSpec } from '@/lib/assets/game-asset-contract'
