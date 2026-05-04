export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  /**
   * Decide whether a thrown error is retryable. Default: retry every error.
   * Use this to skip 4xx (client) errors so we don't burn retries on a
   * permanent failure like a validation error or a 401 logout.
   */
  shouldRetry?: (err: unknown, attempt: number) => boolean
}

/**
 * Retry an async operation with exponential backoff and ±25% jitter.
 *
 * Defaults to 3 attempts (so up to 2 retries), starting at 200ms. Jitter
 * spreads concurrent retries so a transient failure across N callers
 * doesn't all reconnect at the same moment.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions | number = {},
  legacyBaseDelayMs?: number,
): Promise<T> {
  // Backwards-compat: accept the old `withRetry(fn, max, base)` signature.
  const opts: RetryOptions =
    typeof options === 'number'
      ? { maxAttempts: options, baseDelayMs: legacyBaseDelayMs }
      : options
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelayMs = opts.baseDelayMs ?? 200
  const shouldRetry = opts.shouldRetry ?? (() => true)

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isLast = attempt === maxAttempts - 1
      if (isLast || !shouldRetry(err, attempt)) {
        throw err
      }
      const baseMs = baseDelayMs * 2 ** attempt
      const jitter = baseMs * 0.25 * (Math.random() * 2 - 1)
      await new Promise((r) => setTimeout(r, Math.max(0, baseMs + jitter)))
    }
  }
  throw lastError
}
