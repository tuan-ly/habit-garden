import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReadingFocusAction } from '@/capabilities/reading/ui/focus-action'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  start: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/lib/actions/habit-sessions', () => ({
  startReadingSession: mocks.start,
}))

describe('ReadingFocusAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.start.mockResolvedValue({
      success: true,
      data: { id: 'session-1', status: 'running' },
    })
  })

  it('starts the plugin session from the single primary focus action', async () => {
    render(<ReadingFocusAction plantId="plant-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Đọc cùng cây' }))

    await waitFor(() => expect(mocks.start).toHaveBeenCalledWith('plant-1'))
    expect(mocks.push).toHaveBeenCalledWith(
      '/plant/plant-1/journey/session?id=session-1'
    )
  })

  it('routes an awaiting session directly to completion', async () => {
    mocks.start.mockResolvedValue({
      success: true,
      data: { id: 'session-2', status: 'awaiting_completion' },
    })

    render(<ReadingFocusAction plantId="plant-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Đọc cùng cây' }))

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith(
        '/plant/plant-1/journey/completion?id=session-2'
      )
    })
  })
})
