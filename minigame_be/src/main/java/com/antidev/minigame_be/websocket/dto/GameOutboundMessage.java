package com.antidev.minigame_be.websocket.dto;

import com.antidev.minigame_be.websocket.GameEventType;

import java.time.Instant;

public record GameOutboundMessage(
    GameEventType eventType,
    String roomCode,
    String actor,
    Object payload,
    Instant serverTime
) {
}

