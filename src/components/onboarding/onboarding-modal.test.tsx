import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingModal } from './onboarding-modal'

vi.mock('next/image', () => ({
  default: ({ alt, fill }: { alt: string; fill?: boolean }) => {
    void fill
    return <div aria-label={alt} />
  },
}))

const storage = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  clear: () => storage.clear(),
}

describe('OnboardingModal', () => {
  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('records onboarding as complete when the user closes it with Escape', () => {
    render(<OnboardingModal />)

    act(() => vi.advanceTimersByTime(350))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(storage.get('habit-garden-onboarding-completed')).toBe('true')
  })
})
