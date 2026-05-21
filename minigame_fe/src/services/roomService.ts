import type { AdminCreateRoomInput, RoomView } from '../types/room'
import { apiRequest } from './apiClient'

export function createRoom(hostNickname: string): Promise<RoomView> {
  return apiRequest<RoomView>('/api/v1/rooms', {
    method: 'POST',
    body: JSON.stringify({ hostNickname }),
  })
}

export function joinRoom(roomCode: string, nickname: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/rooms/${roomCode}/join`, {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  })
}

export function getRoom(roomCode: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/rooms/${roomCode}`)
}

export function startRoom(roomCode: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/rooms/${roomCode}/start`, {
    method: 'POST',
  })
}

export function createAdminRoom(input: AdminCreateRoomInput): Promise<RoomView> {
  return apiRequest<RoomView>('/api/v1/admin/rooms', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function adminPauseRoom(roomCode: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/pause`, {
    method: 'POST',
  })
}

export function adminResumeRoom(roomCode: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/resume`, {
    method: 'POST',
  })
}

export function adminEndRoom(roomCode: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/end`, {
    method: 'POST',
  })
}

export function adminSkipQuestion(roomCode: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/skip-question`, {
    method: 'POST',
  })
}

export function adminSkipTurn(roomCode: string, playerId?: string): Promise<RoomView> {
  const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : ''
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/skip-turn${query}`, {
    method: 'POST',
  })
}

export function adminResetBell(roomCode: string, playerId: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/reset-bell/${playerId}`, {
    method: 'POST',
  })
}

export function adminKickPlayer(roomCode: string, playerId: string): Promise<RoomView> {
  return apiRequest<RoomView>(`/api/v1/admin/rooms/${roomCode}/players/${playerId}`, {
    method: 'DELETE',
  })
}
