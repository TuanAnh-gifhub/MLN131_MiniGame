package com.antidev.minigame_be.auth.dto;

public record AuthTokenResponse(
    String token,
    String tokenType,
    long expiresInMinutes
) {
}

