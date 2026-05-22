package com.antidev.minigame_be.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminQuestionRequest(
    @NotBlank @Size(min = 2, max = 100) String category,
    @NotBlank @Size(min = 3, max = 300) String clue,
    @NotBlank @Size(min = 1, max = 200) String answer
) {
}

