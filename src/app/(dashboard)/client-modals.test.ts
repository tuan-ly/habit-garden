import { describe, expect, it } from 'vitest'
import { shouldDisplayOnboarding } from './client-modals'

describe('shouldDisplayOnboarding', () => {
  it('shows onboarding to a new account on a new device', () => {
    expect(shouldDisplayOnboarding(false, false)).toBe(true)
  })

  it('does not show onboarding after it has been completed on this device', () => {
    expect(shouldDisplayOnboarding(false, true)).toBe(false)
  })

  it('does not show onboarding to an account with existing progress', () => {
    expect(shouldDisplayOnboarding(true, false)).toBe(false)
  })
})
