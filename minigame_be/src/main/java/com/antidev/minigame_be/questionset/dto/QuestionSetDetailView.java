package com.antidev.minigame_be.questionset.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Full detail view — includes all questions, returned by GET /{id}. */
public record QuestionSetDetailView(
    UUID id,
    String name,
    Instant createdAt,
    List<QuestionItemView> questions
) {
    public record QuestionItemView(
        String category,
        String clue,
        String answer
    ) {}
}
