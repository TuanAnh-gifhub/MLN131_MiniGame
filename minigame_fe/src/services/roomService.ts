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

