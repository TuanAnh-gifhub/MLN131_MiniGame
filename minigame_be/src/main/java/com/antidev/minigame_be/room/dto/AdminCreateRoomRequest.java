package com.antidev.minigame_be.room.dto;

import java.util.List;

public record AdminCreateRoomRequest(
    String hostNickname,
    String roomCode,
    List<AdminQuestionRequest> questions
) {
}


