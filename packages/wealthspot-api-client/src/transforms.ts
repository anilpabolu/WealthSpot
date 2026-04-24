function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

export function convertKeysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel)
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), convertKeysToCamel(v)]),
    )
  }
  return obj
}
