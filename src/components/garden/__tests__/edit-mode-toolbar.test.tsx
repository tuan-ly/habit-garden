import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditModeToolbar } from '../edit-mode/edit-mode-toolbar'

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const defaultProps = {
  canUndo: false,
  hasSelectedItem: false,
  onUndo: vi.fn(),
  onRotate: vi.fn(),
  onStore: vi.fn(),
  onDone: vi.fn(),
}

describe('EditModeToolbar plant movement context', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('keeps plant movement guidance out of the dock when no plant is selected', () => {
    act(() => root.render(<EditModeToolbar {...defaultProps} />))

    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.textContent).not.toContain('Chạm ô trống để đặt')
  })

  it('shows the selected plant and placement instruction in one live status', () => {
    act(() =>
      root.render(
        <EditModeToolbar
          {...defaultProps}
          movingPlantName="Cây đọc sách"
          onCancelPlantMove={vi.fn()}
        />
      )
    )

    const status = container.querySelector('[role="status"]')
    expect(status?.textContent).toContain('Đang di chuyển Cây đọc sách')
    expect(status?.textContent).toContain('Chạm ô trống để đặt')
    expect(status?.getAttribute('aria-live')).toBe('polite')
  })

  it('cancels the current plant movement from the dock', () => {
    const onCancelPlantMove = vi.fn()
    act(() =>
      root.render(
        <EditModeToolbar
          {...defaultProps}
          movingPlantName="Cây đọc sách"
          onCancelPlantMove={onCancelPlantMove}
        />
      )
    )

    const cancelButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Hủy di chuyển Cây đọc sách"]'
    )
    expect(cancelButton).not.toBeNull()
    act(() => cancelButton?.click())
    expect(onCancelPlantMove).toHaveBeenCalledOnce()
  })
})
