package com.antidev.minigame_be.questionset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuestionSetItemRequest(
    @NotBlank @Size(min = 2, max = 100) String category,
    @NotBlank @Size(min = 3, max = 300) String clue,
    @NotBlank @Size(min = 1, max = 200) String answer
) {}
