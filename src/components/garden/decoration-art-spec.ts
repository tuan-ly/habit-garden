export interface DecorationArtSpec {
  /** Normalized contact point inside the source canvas/emoji box. */
  anchorX: number
  anchorY: number
  scale: number
}

// PNG values come from alpha-bound measurement. Emoji values are optical
// anchors because native glyph canvases do not expose their alpha bounds.
const ART_SPECS: Record<string, DecorationArtSpec> = {
  'stone-lantern': { anchorX: 0.424, anchorY: 0.762, scale: 1.08 },
  'koi-pond': { anchorX: 0.513, anchorY: 0.761, scale: 1.04 },
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
  return ART_SPECS[slug] ?? (hasImage ? DEFAULT_IMAGE_SPEC : DEFAULT_EMOJI_SPEC)
}

export function getGroundedArtTransform(spec: DecorationArtSpec): React.CSSProperties {
  const translateX = (0.5 - spec.anchorX) * 100
  const translateY = (1 - spec.anchorY) * 100

  return {
    transform: `translate(${translateX}%, ${translateY}%) scale(${spec.scale})`,
    transformOrigin: `${spec.anchorX * 100}% ${spec.anchorY * 100}%`,
  }
}
