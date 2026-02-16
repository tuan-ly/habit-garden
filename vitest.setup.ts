import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Global test utilities
beforeEach(() => {
  // Reset any mocks before each test
  vi.clearAllMocks()
})
