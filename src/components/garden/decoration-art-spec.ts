import { getDecorationAssetSpec, type GameAssetDisplaySpec } from '@/lib/assets/game-asset-contract'
export { getGroundedArtTransform } from '@/lib/assets/game-asset-display'

export interface DecorationArtSpec extends GameAssetDisplaySpec {
  /** Normalized contact point inside the source canvas/emoji box. */
  anchorX: number
  anchorY: number
}

// Emoji values are optical anchors because native glyph canvases do not
// expose alpha bounds. PNG anchors come from the generated asset manifest.
const EMOJI_ART_SPECS: Record<string, DecorationArtSpec> = {
  'stepping-stone': { anchorX: 0.54, anchorY: 0.86, scale: 1, offsetX: 0, offsetY: 0 },
  'paper-lantern': { anchorX: 0.54, anchorY: 0.88, scale: 1, offsetX: 0, offsetY: 0 },
  'garden-bench': { anchorX: 0.52, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
}

const DEFAULT_IMAGE_SPEC: DecorationArtSpec = {
  anchorX: 0.5,
  anchorY: 0.86,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}

const DEFAULT_EMOJI_SPEC: DecorationArtSpec = {
  anchorX: 0.52,
  anchorY: 0.88,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}

export function getDecorationArtSpec(slug: string, hasImage: boolean): DecorationArtSpec {
  if (hasImage) return getDecorationAssetSpec(slug)?.display ?? DEFAULT_IMAGE_SPEC
  return EMOJI_ART_SPECS[slug] ?? DEFAULT_EMOJI_SPEC
}
