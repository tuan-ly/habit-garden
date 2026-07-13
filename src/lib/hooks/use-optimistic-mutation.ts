'use client'

import { useCallback, useReducer, useRef } from 'react'

export interface OptimisticMutationEntry<TSnapshot> {
  mutationId: string
  snapshot: TSnapshot
  status: 'pending' | 'failed'
  error?: string
}

export type OptimisticMutationState<TSnapshot> = Record<string, OptimisticMutationEntry<TSnapshot>>

export type OptimisticMutationAction<TSnapshot> =
  | { type: 'begin'; entityId: string; mutationId: string; snapshot: TSnapshot }
  | { type: 'success'; entityId: string }
  | { type: 'failure'; entityId: string; error: string }

export function optimisticMutationReducer<TSnapshot>(
  state: OptimisticMutationState<TSnapshot>,
  action: OptimisticMutationAction<TSnapshot>
): OptimisticMutationState<TSnapshot> {
  if (action.type === 'begin') {
    return {
      ...state,
      [action.entityId]: {
        mutationId: action.mutationId,
        snapshot: action.snapshot,
        status: 'pending',
      },
    }
  }
  if (action.type === 'success') {
    const next = { ...state }
    delete next[action.entityId]
    return next
  }
  const entry = state[action.entityId]
  if (!entry) return state
  return { ...state, [action.entityId]: { ...entry, status: 'failed', error: action.error } }
}

interface MutationResult {
  success: boolean
  error?: string
}

interface UseOptimisticMutationOptions<TInput, TSnapshot, TResult extends MutationResult> {
  getSnapshot: (entityId: string) => TSnapshot
  applyOptimistic: (entityId: string, input: TInput) => void
  mutate: (input: TInput, mutationId: string) => Promise<TResult>
  reconcile: (entityId: string, result: TResult) => void
  rollback: (entityId: string, snapshot: TSnapshot) => void
}

/** Shared entity-scoped optimistic mutation with canonical reconcile and stable retry id. */
export function useOptimisticMutation<TInput, TSnapshot, TResult extends MutationResult>(
  options: UseOptimisticMutationOptions<TInput, TSnapshot, TResult>
) {
  const [state, dispatch] = useReducer(optimisticMutationReducer<TSnapshot>, {})
  const retries = useRef(new Map<string, () => Promise<TResult>>())

  const run = useCallback(async (
    entityId: string,
    input: TInput,
    existingMutationId?: string
  ): Promise<TResult> => {
    const mutationId = existingMutationId ?? crypto.randomUUID()
    const snapshot = options.getSnapshot(entityId)
    dispatch({ type: 'begin', entityId, mutationId, snapshot })
    options.applyOptimistic(entityId, input)

    const execute = async () => {
      try {
        const result = await options.mutate(input, mutationId)
        if (!result.success) throw new Error(result.error || 'Mutation failed')
        options.reconcile(entityId, result)
        retries.current.delete(entityId)
        dispatch({ type: 'success', entityId })
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Mutation failed'
        options.rollback(entityId, snapshot)
        dispatch({ type: 'failure', entityId, error: message })
        throw error
      }
    }

    retries.current.set(entityId, () => run(entityId, input, mutationId))
    return execute()
  }, [options])

  const retry = useCallback((entityId: string) => retries.current.get(entityId)?.(), [])
  const isPending = useCallback(
    (entityId: string) => state[entityId]?.status === 'pending',
    [state]
  )

  return { run, retry, isPending, mutations: state }
}
