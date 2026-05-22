package com.antidev.minigame_be.websocket;

public enum GameEventType {
    PLAYER_JOIN,
    PLAYER_READY,
    START_GAME,
    RING_BELL,
    GUESS_LETTER,
    GUESS_ANSWER,
    TURN_CHANGE,
    GAME_UPDATE,
    ROUND_END,
    GAME_END,
    ADMIN_PAUSE,
    ADMIN_RESUME,
    ADMIN_END,
    ADMIN_SKIP_TURN,
    ADMIN_SKIP_QUESTION,
    ADMIN_RESET_BELL,
    ADMIN_KICK_PLAYER
}

