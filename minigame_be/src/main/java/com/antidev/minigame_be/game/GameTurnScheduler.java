package com.antidev.minigame_be.game;

import com.antidev.minigame_be.domain.GameSession;
import com.antidev.minigame_be.domain.GameSessionStatus;
import com.antidev.minigame_be.domain.Player;
import com.antidev.minigame_be.repository.GameSessionRepository;
import com.antidev.minigame_be.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GameTurnScheduler {

    private static final Duration TURN_TIMEOUT = Duration.ofSeconds(10);

    private final GameSessionRepository gameSessionRepository;
    private final PlayerRepository playerRepository;
    private final GameEngineService gameEngineService;

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void rotateExpiredTurns() {
        // Disabled automatic turn rotation as per user request.
        // Admin will manually skip turns.
    }
}

