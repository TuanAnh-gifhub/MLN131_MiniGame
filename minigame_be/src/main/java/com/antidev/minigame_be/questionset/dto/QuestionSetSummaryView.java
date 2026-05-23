package com.antidev.minigame_be.questionset.dto;

import java.time.Instant;
import java.util.UUID;

/** Light-weight summary returned in list responses (no questions included). */
public record QuestionSetSummaryView(
    UUID id,
    String name,
    int questionCount,
    Instant createdAt
) {}
