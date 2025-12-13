export function getUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

export function objToArr<T, V>(obj: Record<string, T>, fn?: (value: T) => V) {
  return Object.keys(obj).map(key => fn ? fn(obj[key]) : obj[key]) as V[]
}
