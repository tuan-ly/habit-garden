'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DecorationType, DecorationRotation } from '@/types/database'
import { getDecorationArtSpec, getGroundedArtTransform } from './decoration-art-spec'
import { getTileOffsetTransform } from '@/lib/assets/game-asset-display'

const SIZE_CONFIG = {
  sm:  { width: 32,  height: 32,  className: 'w-8 h-8' },
  md:  { width: 48,  height: 48,  className: 'w-12 h-12' },
  lg:  { width: 64,  height: 64,  className: 'w-16 h-16' },
  xl:  { width: 96,  height: 96,  className: 'w-24 h-24' },
} as const

interface DecorationImageProps {
  decorationType: DecorationType
  size?: keyof typeof SIZE_CONFIG
  rotation?: DecorationRotation
  isGhost?: boolean
  className?: string
  /** Exact rendered size for grid-scaled garden entities. */
  pixelSize?: number
  /** Bottom-anchor the visible art to the garden contact point. */
  grounded?: boolean
  /** Garden tile size used to resolve tile-relative reviewed offsets. */
  tileSize?: number
}

/**
 * Renders a decoration image with rotation support and emoji fallback.
 */
export function DecorationImage({
  decorationType,
  size = 'lg',
  rotation = 0,
  isGhost = false,
  className,
  pixelSize,
  grounded = false,
  tileSize = 0,
}: DecorationImageProps) {
  const [imgError, setImgError] = useState(false)
  const sizeConfig = SIZE_CONFIG[size]
  const imagePath = decorationType.image_url
  const hasImage = !!imagePath && !imgError
  const artSpec = getDecorationArtSpec(decorationType.slug, hasImage, decorationType.grid_size)
  const groundedStyle = grounded ? getGroundedArtTransform(artSpec) : undefined
  const offsetStyle = grounded ? getTileOffsetTransform(artSpec, tileSize) : undefined

  const rotationStyle = {
    // Grounded isometric sprites need directional art to rotate around the
    // world's vertical axis. CSS rotate() spins the screen plane and makes
    // upright objects lie sideways, so keep single-variant garden art upright.
    ...(!grounded && rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : {}),
    ...offsetStyle,
    ...(pixelSize ? { width: pixelSize, height: pixelSize } : {}),
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        !pixelSize && sizeConfig.className,
        isGhost && 'opacity-50',
        className
      )}
      style={rotationStyle}
    >
      {hasImage ? (
        <Image
          src={imagePath}
          alt={decorationType.name}
          width={pixelSize ?? sizeConfig.width}
          height={pixelSize ?? sizeConfig.height}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-contain"
          style={groundedStyle}
        />
      ) : (
        <span
          className={cn(
            'flex h-full w-full select-none justify-center leading-none',
            grounded ? 'items-end' : 'items-center',
          )}
          style={pixelSize ? { '--decoration-size': `${pixelSize}px` } as React.CSSProperties : undefined}
          role="img"
          aria-label={decorationType.name}
        >
          <span
            data-decoration-emoji-glyph="true"
            className={cn(
              'inline-block',
              size === 'sm' && 'text-lg',
              size === 'md' && 'text-2xl',
              size === 'lg' && 'text-3xl',
              size === 'xl' && 'text-5xl',
              pixelSize && 'text-[length:calc(var(--decoration-size)*0.52)]',
            )}
            style={groundedStyle}
          >
            {decorationType.icon}
          </span>
        </span>
      )}

      {/* Ghost border for placement preview */}
      {isGhost && (
        <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg" />
      )}
    </div>
  )
}
