export interface CapabilityRegistry<T> {
  entries: Readonly<Record<string, T>>
  get: (key: string) => T | null
  has: (key: string) => boolean
  list: () => T[]
}

export function createCapabilityRegistry<T>(
  entries: Record<string, T>
): CapabilityRegistry<T> {
  const registered = Object.freeze({ ...entries })

  return {
    entries: registered,
    get: key => registered[key] ?? null,
    has: key => Object.prototype.hasOwnProperty.call(registered, key),
    list: () => Object.values(registered),
  }
}
