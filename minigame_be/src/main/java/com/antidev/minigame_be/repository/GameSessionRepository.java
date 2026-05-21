package com.antidev.minigame_be.repository;

import com.antidev.minigame_be.domain.GameSession;
import com.antidev.minigame_be.domain.GameSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameSessionRepository extends JpaRepository<GameSession, UUID> {
    Optional<GameSession> findFirstByRoomCodeAndStatusOrderByStartedAtDesc(String roomCode, GameSessionStatus status);

    Optional<GameSession> findFirstByRoomCodeOrderByStartedAtDesc(String roomCode);

    List<GameSession> findByStatus(GameSessionStatus status);
}


