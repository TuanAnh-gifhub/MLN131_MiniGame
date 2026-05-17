package com.antidev.minigame_be.websocket;

public enum GameEventType {
    PLAYER_JOIN,
    PLAYER_READY,
    START_GAME,
    GUESS_LETTER,
    GUESS_ANSWER,
    TURN_CHANGE,
    GAME_UPDATE,
    ROUND_END,
    GAME_END,
    ADMIN_SKIP_TURN,
    ADMIN_START_TIMER,
    ADMIN_PAUSE_TIMER
}

