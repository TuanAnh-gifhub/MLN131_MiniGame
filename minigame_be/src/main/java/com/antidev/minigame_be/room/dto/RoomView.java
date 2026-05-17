package com.antidev.minigame_be.room.dto;

import com.antidev.minigame_be.domain.RoomStatus;

import java.util.List;
import java.util.UUID;

public record RoomView(
    UUID id,
    String code,
    String hostNickname,
    RoomStatus status,
    List<PlayerView> players,
    UUID currentTurnPlayerId,
    Integer currentRound,
    Integer totalRounds,
    String clue,
    String maskedAnswer,
    String usedLetters,
    String wrongGuessers
) {
}

