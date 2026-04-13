package com.antidev.minigame_be.room.dto;

public record AdminQuestionRequest(
    String category,
    String clue,
    String answer
) {
}

