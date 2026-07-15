import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DecorationImage } from '../decoration-image'
import { PlacementGhost } from '../edit-mode/placement-ghost'
import { DecorationPlacementGhostLayer } from '../edit-mode/decoration-placement-ghost-layer'
import type { DecorationType } from '@/types/database'
import { getDecorationArtSpec, getGroundedArtTransform } from '../decoration-art-spec'

const emojiDecoration = {
  slug: 'paper-lantern',
  name: 'Paper Lantern',
  icon: '🏮',
  image_url: null,
  grid_size: 1,
} as DecorationType

const stoneLantern = {
  ...emojiDecoration,
  slug: 'stone-lantern',
  name: 'Stone Lantern',
  image_url: '/garden/decorations/sanctuary-rock-lantern.png',
  grid_size: 2,
} as DecorationType

describe('DecorationImage emoji grounding', () => {
  it('bottom-aligns the glyph and applies the anchor transform to the glyph itself', () => {
    const html = renderToStaticMarkup(
      <DecorationImage decorationType={emojiDecoration} pixelSize={100} grounded />
    )

    expect(html).toContain('items-end')
    expect(html).toContain('data-decoration-emoji-glyph="true"')
    expect(html).toContain('transform:translate(-4%, 12%) scale(1)')
  })

  it('keeps catalog emoji centered when ground anchoring is not requested', () => {
    const html = renderToStaticMarkup(
      <DecorationImage decorationType={emojiDecoration} size="lg" />
    )

    expect(html).toContain('items-center')
  })

  it('keeps grounded single-variant art upright instead of rotating it in the screen plane', () => {
    const html = renderToStaticMarkup(
      <DecorationImage decorationType={emojiDecoration} rotation={270} pixelSize={100} grounded />
    )

    expect(html).not.toContain('rotate(270deg)')
  })

  it('preserves rotation for non-grounded previews', () => {
    const html = renderToStaticMarkup(
      <DecorationImage decorationType={emojiDecoration} rotation={270} size="lg" />
    )

    expect(html).toContain('rotate(270deg)')
  })

  it('uses the same reviewed transform for placed and placement-ghost art', () => {
    const placed = renderToStaticMarkup(
      <DecorationImage decorationType={stoneLantern} pixelSize={124} tileSize={100} grounded />
    )
    const ghost = renderToStaticMarkup(
      <PlacementGhost decorationType={stoneLantern} rotation={0} isValid pixelSize={124} tileSize={100} />
    )

    const reviewedTransform = getGroundedArtTransform(getDecorationArtSpec('stone-lantern', true, 2)).transform
    expect(placed).toContain(reviewedTransform)
    expect(ghost).toContain(reviewedTransform)
  })

  it('renders the complete ghost asset in an independent world-space layer', () => {
    const html = renderToStaticMarkup(
      <DecorationPlacementGhostLayer
        row={2}
        col={3}
        gridSize={8}
        tileSize={100}
        decorationType={stoneLantern}
        rotation={0}
        isValid
      />
    )

    expect(html).toContain('data-placement-ghost="true"')
    expect(html).toContain('left:450px')
    expect(html).toContain('top:175px')
    expect(html).toContain('alt="Stone Lantern"')
    expect(html).toContain('sanctuary-rock-lantern.png')
  })
})
