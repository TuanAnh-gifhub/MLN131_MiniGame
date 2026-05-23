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
    throw new ApiClientError(0, 'Không thể kết nối đến dịch vụ backend. Vui lòng kiểm tra backend đang chạy.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined
    throw new ApiClientError(response.status, body?.message ?? 'Yêu cầu thất bại', body)
  }

  // 204 No Content — no body to parse (e.g. DELETE endpoints)
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

