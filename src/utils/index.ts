export function getUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
}

export function objToArr<V>(obj: Record<string, V>): V[]
export function objToArr<V, R>(obj: Record<string, V>, fn: (value: V) => R): R[]
export function objToArr<V, R>(obj: Record<string, V>, fn?: (value: V) => R) {
  return fn ? Object.values(obj).map(fn) : (Object.values(obj) as V[])
}
