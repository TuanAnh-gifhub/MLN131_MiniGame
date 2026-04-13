import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { env } from '../config/env'
import type { GameInboundMessage, GameOutboundMessage } from '../types/socket'

class SocketClient {
  private client: Client | null = null

  connect(onMessage: (message: GameOutboundMessage) => void, roomCode: string, token?: string): Promise<void> {
    if (this.client?.active) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const client = new Client({
        webSocketFactory: () => new SockJS(env.wsUrl),
        reconnectDelay: 3000,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        onConnect: () => {
          client.subscribe(`/topic/rooms/${roomCode}`, (frame) => {
            onMessage(JSON.parse(frame.body) as GameOutboundMessage)
          })
          resolve()
        },
        onStompError: (frame) => {
          reject(new Error(frame.headers.message ?? 'WebSocket error'))
        },
      })

      client.activate()
      this.client = client
    })
  }

  publish(roomCode: string, message: GameInboundMessage): void {
    if (!this.client?.connected) {
      return
    }

    this.client.publish({
      destination: `/app/rooms/${roomCode}/event`,
      body: JSON.stringify(message),
    })
  }

  disconnect(): void {
    this.client?.deactivate()
    this.client = null
  }
}

export const socketClient = new SocketClient()

