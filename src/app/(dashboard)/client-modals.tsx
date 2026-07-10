'use client'

import dynamic from 'next/dynamic'

// Dynamic imports for rarely-shown modals — reduces initial JS bundle.
// Must live in a Client Component because `ssr: false` is not allowed in Server Components.
const OnboardingModal = dynamic(
  () => import('@/components/onboarding').then(m => ({ default: m.OnboardingModal })),
  { ssr: false }
)
export function ClientModals() {
  return <OnboardingModal />
}
