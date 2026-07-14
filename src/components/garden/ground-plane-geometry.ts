export interface GroundPoint {
  x: number
  y: number
}

export interface LivingEmbankmentFace {
  top: GroundPoint[]
  bottom: GroundPoint[]
}

export interface LivingEmbankmentGeometry {
  left: LivingEmbankmentFace
  right: LivingEmbankmentFace
  frontTop: GroundPoint
  frontBottom: GroundPoint
  sideDepth: number
  frontDepth: number
  canvasHeight: number
}

export const LIVING_EMBANKMENT_SIDE_DEPTH_RATIO = 0.56
export const LIVING_EMBANKMENT_FRONT_DEPTH_RATIO = 0.82
export const LIVING_EMBANKMENT_MAX_WOBBLE_RATIO = 0.025
export const LIVING_EMBANKMENT_SAMPLE_COUNT = 9
export const LIVING_EMBANKMENT_SHADOW_BLEED_RATIO = 0.56

const DEPTH_WOBBLE_PROFILE = [0, 0.01, -0.008, 0.014, -0.006, 0.012, -0.004, 0.008, 0] as const

function interpolate(start: GroundPoint, end: GroundPoint, t: number): GroundPoint {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  }
}

function sampleFace(
  cap: GroundPoint,
  shoulder: GroundPoint,
  frontShoulder: GroundPoint,
  front: GroundPoint,
  tileSize: number,
  sideSign: -1 | 1
): LivingEmbankmentFace {
  const top: GroundPoint[] = []
  const bottom: GroundPoint[] = []

  for (let index = 0; index < LIVING_EMBANKMENT_SAMPLE_COUNT; index++) {
    const t = index / (LIVING_EMBANKMENT_SAMPLE_COUNT - 1)
    // The endpoint samples sit at the true extremes of the two rounded grass
    // caps. The seven samples between them follow the visible straight edge,
    // including both shoulders, so neither corner can expose the background.
    const isOuterCap = index === 0
    const isFrontCap = index === LIVING_EMBANKMENT_SAMPLE_COUNT - 1
    const edgeT = (index - 1) / (LIVING_EMBANKMENT_SAMPLE_COUNT - 3)
    const base = isOuterCap
      ? cap
      : isFrontCap
        ? front
        : interpolate(shoulder, frontShoulder, edgeT)
    const edgeWobble = isOuterCap || isFrontCap
      ? 0
      : Math.sin(edgeT * Math.PI) * Math.sin(edgeT * Math.PI * 2) * tileSize * 0.012 * sideSign
    const topPoint = { x: base.x, y: base.y + edgeWobble }
    const baseDepthRatio = LIVING_EMBANKMENT_SIDE_DEPTH_RATIO
      + (LIVING_EMBANKMENT_FRONT_DEPTH_RATIO - LIVING_EMBANKMENT_SIDE_DEPTH_RATIO) * t
    const wobbleRatio = DEPTH_WOBBLE_PROFILE[index]
    const depth = tileSize * (baseDepthRatio + wobbleRatio)

    top.push(topPoint)
    const outerTuck = (1 - t) * tileSize * 0.08 * sideSign
    bottom.push({ x: topPoint.x + outerTuck, y: topPoint.y + depth })
  }

  return { top, bottom }
}

export function getLivingEmbankmentDepth(tileSize: number): number {
  return tileSize * LIVING_EMBANKMENT_FRONT_DEPTH_RATIO
}

export function getGroundPlaneHeight(gridSize: number, tileSize: number, cinematic: boolean): number {
  const diamondHeight = gridSize * (tileSize / 2)
  if (!cinematic) return diamondHeight + tileSize * 0.3
  return diamondHeight
    + getLivingEmbankmentDepth(tileSize)
    + tileSize * LIVING_EMBANKMENT_SHADOW_BLEED_RATIO
}

export function createLivingEmbankmentGeometry(
  gridSize: number,
  tileSize: number
): LivingEmbankmentGeometry {
  const width = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)
  const organicRadius = Math.max(16, tileSize * 0.22)
  const sideInset = organicRadius * 1.12
  const sideInsetY = organicRadius * 0.48
  const frontTop = { x: width / 2, y: diamondHeight - sideInsetY / 2 }
  const leftCap = { x: sideInset / 2, y: diamondHeight / 2 }
  const rightCap = { x: width - sideInset / 2, y: diamondHeight / 2 }
  const leftShoulder = { x: sideInset, y: diamondHeight / 2 + sideInsetY }
  const rightShoulder = { x: width - sideInset, y: diamondHeight / 2 + sideInsetY }
  const leftFrontShoulder = { x: width / 2 - organicRadius, y: diamondHeight - sideInsetY }
  const rightFrontShoulder = { x: width / 2 + organicRadius, y: diamondHeight - sideInsetY }
  const left = sampleFace(leftCap, leftShoulder, leftFrontShoulder, frontTop, tileSize, 1)
  const right = sampleFace(rightCap, rightShoulder, rightFrontShoulder, frontTop, tileSize, -1)
  const sideDepth = tileSize * LIVING_EMBANKMENT_SIDE_DEPTH_RATIO
  const frontDepth = getLivingEmbankmentDepth(tileSize)
  const frontBottom = { x: frontTop.x, y: frontTop.y + frontDepth }

  // Both faces intentionally share the exact same objects at the front seam.
  left.top[left.top.length - 1] = frontTop
  right.top[right.top.length - 1] = frontTop
  left.bottom[left.bottom.length - 1] = frontBottom
  right.bottom[right.bottom.length - 1] = frontBottom

  return {
    left,
    right,
    frontTop,
    frontBottom,
    sideDepth,
    frontDepth,
    canvasHeight: getGroundPlaneHeight(gridSize, tileSize, true),
  }
}
