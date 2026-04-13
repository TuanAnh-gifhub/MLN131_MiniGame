import { env } from '../config/env'
import type { ApiErrorResponse } from '../types/room'

export class ApiClientError extends Error {
  readonly status: number
  readonly response?: ApiErrorResponse

  constructor(status: number, message: string, response?: ApiErrorResponse) {
    super(message)
    this.status = status
    this.response = response
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
    })
  } catch {
    throw new ApiClientError(0, 'Cannot connect to backend service. Please ensure backend is running.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined
    throw new ApiClientError(response.status, body?.message ?? 'Request failed', body)
  }

  return (await response.json()) as T
}

