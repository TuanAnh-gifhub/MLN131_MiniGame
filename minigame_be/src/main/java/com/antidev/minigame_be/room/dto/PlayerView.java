package com.antidev.minigame_be.room.dto;

import java.util.UUID;

public record PlayerView(
    UUID id,
    String nickname,
    int score,
    boolean host,
    boolean ready,
    boolean connected
) {
}

