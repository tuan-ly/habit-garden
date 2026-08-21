'use client'

import type { ReactNode } from 'react'
import { ReadingFocusAction } from '@/capabilities/reading/ui/focus-action'
import { createCapabilityRegistry } from '@/capabilities/core/registry'
import type { CapabilityKey } from '@/capabilities/core/types'

export interface CapabilityFocusActionProps {
  capabilityType: string
  plantId: string
  className?: string
}

type RegisteredFocusActionProps = Omit<CapabilityFocusActionProps, 'capabilityType'>
type CapabilityFocusActionRenderer = (props: RegisteredFocusActionProps) => ReactNode

const focusActionRegistry = createCapabilityRegistry<CapabilityFocusActionRenderer>({
  reading: props => <ReadingFocusAction {...props} />,
} satisfies Record<CapabilityKey, CapabilityFocusActionRenderer>)

export function CapabilityFocusAction({
  capabilityType,
  plantId,
  className,
}: CapabilityFocusActionProps) {
  const renderFocusAction = focusActionRegistry.get(capabilityType)
  if (!renderFocusAction) return null

  return renderFocusAction({ plantId, className })
}

export function hasCapabilityFocusAction(capabilityType: string): boolean {
  return focusActionRegistry.has(capabilityType)
}
