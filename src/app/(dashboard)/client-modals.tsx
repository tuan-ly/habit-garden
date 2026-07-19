'use client'

import dynamic from 'next/dynamic'
import { useSyncExternalStore } from 'react'

const subscribeToLocalStorage = () => () => undefined

// Dynamic imports for rarely-shown modals — reduces initial JS bundle.
// Must live in a Client Component because `ssr: false` is not allowed in Server Components.
const OnboardingModal = dynamic(
  () => import('@/components/onboarding').then(m => ({ default: m.OnboardingModal })),
  { ssr: false }
)
export function ClientModals() {
  const shouldLoadOnboarding = useSyncExternalStore(
    subscribeToLocalStorage,
    () => !localStorage.getItem('habit-garden-onboarding-completed'),
    () => false
  )

  return shouldLoadOnboarding ? <OnboardingModal /> : null
}
