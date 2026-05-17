function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

function camelToSnake(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  if (value instanceof Date) return false
  if (typeof FormData !== 'undefined' && value instanceof FormData) return false
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) return false
  if (typeof Blob !== 'undefined' && value instanceof Blob) return false
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return false
  return Object.getPrototypeOf(value) === Object.prototype
}

export function convertKeysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel)
  if (isPlainObject(obj)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), convertKeysToCamel(v)]),
    )
  }
  return obj
}

export function convertKeysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake)
  if (isPlainObject(obj)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [camelToSnake(k), convertKeysToSnake(v)]),
    )
  }
  return obj
}
