package com.antidev.minigame_be.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GuestLoginRequest(
    @NotBlank @Size(min = 2, max = 30) String nickname,
    @NotBlank @Size(min = 4, max = 12) String roomCode
) {
}

