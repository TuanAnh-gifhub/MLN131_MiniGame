package com.antidev.minigame_be.websocket.dto;

import com.antidev.minigame_be.websocket.GameEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GameInboundMessage(
    @NotNull GameEventType eventType,
    @NotBlank String actor,
    String payload
) {
}

