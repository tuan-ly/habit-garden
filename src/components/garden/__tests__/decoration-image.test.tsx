import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DecorationImage } from '../decoration-image'
import type { DecorationType } from '@/types/database'

const emojiDecoration = {
  slug: 'paper-lantern',
  name: 'Paper Lantern',
  icon: '🏮',
  image_url: null,
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
})
