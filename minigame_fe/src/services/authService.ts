import { apiRequest } from './apiClient'

interface AuthTokenResponse {
  token: string
  tokenType: string
  expiresInMinutes: number
}

export async function requestGuestToken(nickname: string, roomCode: string): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>('/api/v1/auth/guest-token', {
    method: 'POST',
    body: JSON.stringify({ nickname, roomCode }),
  })
}

