import { describe, expect, it } from 'vitest'
import { optimisticMutationReducer, type OptimisticMutationState } from './use-optimistic-mutation'

describe('optimisticMutationReducer', () => {
  it('tracks pending state per entity', () => {
    const first = optimisticMutationReducer({}, {
      type: 'begin', entityId: 'plant-a', mutationId: 'intent-1', snapshot: { value: 1 },
    })
    const second = optimisticMutationReducer(first, {
      type: 'begin', entityId: 'plant-b', mutationId: 'intent-2', snapshot: { value: 2 },
    })
    expect(second['plant-a'].status).toBe('pending')
    expect(second['plant-b'].mutationId).toBe('intent-2')
  })

  it('keeps snapshot and mutation id for retry after rollback', () => {
    const pending = optimisticMutationReducer({}, {
      type: 'begin', entityId: 'plant-a', mutationId: 'intent-1', snapshot: { value: 1 },
    })
    const failed = optimisticMutationReducer(pending, {
      type: 'failure', entityId: 'plant-a', error: 'offline',
    })
    expect(failed['plant-a']).toEqual({
      mutationId: 'intent-1', snapshot: { value: 1 }, status: 'failed', error: 'offline',
    })
  })

  it('removes only the reconciled entity', () => {
    const state: OptimisticMutationState<number> = {
      a: { mutationId: '1', snapshot: 1, status: 'pending' },
      b: { mutationId: '2', snapshot: 2, status: 'pending' },
    }
    expect(optimisticMutationReducer(state, { type: 'success', entityId: 'a' })).toEqual({
      b: state.b,
    })
  })
})
