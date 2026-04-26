import axios, { type AxiosError } from 'axios'

/**
 * Shape of error responses produced by the API. The backend always returns
 * { detail, code? } — see services/api/app/main.py exception handlers.
 */
interface ApiErrorBody {
  detail?: string
  code?: string | null
  errors?: Array<{ field: string; message: string }>
  request_id?: string | null
}

export interface FormattedApiError {
  title: string
  message: string
  code: string | null
  status: number | null
  /** True for connection failures (no response received) including CORS */
  isNetworkError: boolean
}

/**
 * Format an arbitrary thrown value (typically from axios / React Query) into a
 * user-friendly title + message. Distinguishes network/CORS failures from
 * server responses so we can surface the right hint to the user.
 */
export function formatApiError(err: unknown): FormattedApiError {
  if (axios.isAxiosError(err)) {
    return formatAxiosError(err)
  }
  if (err instanceof Error) {
    return {
      title: 'Something went wrong',
      message: err.message || 'Unexpected error',
      code: null,
      status: null,
      isNetworkError: false,
    }
  }
  return {
    title: 'Something went wrong',
    message: 'Unexpected error',
    code: null,
    status: null,
    isNetworkError: false,
  }
}

function formatAxiosError(err: AxiosError): FormattedApiError {
  // No response → network / CORS / DNS / aborted
  if (!err.response) {
    return {
      title: 'Connection problem',
      message:
        "We couldn't reach the server. Please check your internet connection and try again.",
      code: 'NETWORK_ERROR',
      status: null,
      isNetworkError: true,
    }
  }

  const status = err.response.status
  const body = (err.response.data ?? {}) as ApiErrorBody
  const code = body.code ?? null
  const detail = body.detail || ''

  if (status === 401) {
    return {
      title: 'Sign-in required',
      message: detail || 'Please sign in again to continue.',
      code,
      status,
      isNetworkError: false,
    }
  }
  if (status === 403) {
    return {
      title: 'Not allowed',
      message: detail || "You don't have permission to do that.",
      code,
      status,
      isNetworkError: false,
    }
  }
  if (status === 404) {
    return {
      title: 'Not found',
      message: detail || "We couldn't find that record.",
      code,
      status,
      isNetworkError: false,
    }
  }
  if (status === 409) {
    return {
      title: 'Conflict',
      message: detail || 'This would conflict with existing data.',
      code,
      status,
      isNetworkError: false,
    }
  }
  if (status === 422) {
    const firstFieldError = body.errors?.[0]
    const message = firstFieldError
      ? `${firstFieldError.field ? `${firstFieldError.field}: ` : ''}${firstFieldError.message}`
      : detail || 'Some fields are invalid.'
    return {
      title: 'Check your input',
      message,
      code,
      status,
      isNetworkError: false,
    }
  }
  if (status === 429) {
    return {
      title: 'Too many requests',
      message: detail || 'Slow down a moment and try again.',
      code,
      status,
      isNetworkError: false,
    }
  }
  if (status >= 500) {
    return {
      title: 'Server error',
      message:
        detail || 'Something broke on our end. Please try again in a moment.',
      code,
      status,
      isNetworkError: false,
    }
  }

  return {
    title: 'Request failed',
    message: detail || `Request failed with status ${status}`,
    code,
    status,
    isNetworkError: false,
  }
}
