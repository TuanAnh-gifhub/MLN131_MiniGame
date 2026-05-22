import { describe, expect, it } from 'vitest'
import { normalizeRoomCode } from './roomCode'

describe('normalizeRoomCode', () => {
  it('normalizes spaces and casing', () => {
    expect(normalizeRoomCode(' abcd12 ')).toBe('ABCD12')
  })
})

