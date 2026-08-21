'use client'

import { getCapabilityManifest } from '@/capabilities/core/catalog'
import { CapabilityIcon } from '@/components/capabilities/capability-icon'

interface CapabilityCharmProps {
  capabilityType: string
  cinematic?: boolean
}

export function CapabilityCharm({ capabilityType, cinematic = false }: CapabilityCharmProps) {
  const manifest = getCapabilityManifest(capabilityType)
  if (!manifest) return null

  return (
    <div
      data-guided-capability={manifest.key}
      className="pointer-events-none absolute right-0 top-0 z-20 grid h-7 w-7 place-items-center rounded-xl border-2 border-[#fff8df] bg-[#31523b] text-[#fff8df] shadow-[0_5px_14px_rgba(35,65,39,0.28)]"
      style={{ transform: cinematic ? 'translate(14px, -18px)' : 'translate(10px, -10px)' }}
      title={manifest.label}
      aria-label={manifest.label}
    >
      <CapabilityIcon icon={manifest.icon} className="h-3.5 w-3.5" />
    </div>
  )
}
