package com.antidev.minigame_be.questionset.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record QuestionSetRequest(
    @NotBlank @Size(min = 1, max = 100) String name,
    @NotNull @Valid @Size(min = 1, max = 50) List<QuestionSetItemRequest> questions
) {}
