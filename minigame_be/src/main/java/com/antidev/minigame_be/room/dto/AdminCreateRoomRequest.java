package com.antidev.minigame_be.room.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminCreateRoomRequest(
    @NotBlank @Size(min = 2, max = 30) String hostNickname,
    @Size(min = 4, max = 12) String roomCode,
    @NotNull @Valid @Size(min = 1, max = 50) List<AdminQuestionRequest> questions
) {
}


