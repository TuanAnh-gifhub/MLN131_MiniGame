package com.antidev.minigame_be.repository;

import com.antidev.minigame_be.domain.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlayerRepository extends JpaRepository<Player, UUID> {
    List<Player> findByRoomCodeOrderByJoinedAtAsc(String roomCode);

    Optional<Player> findByRoomCodeAndNicknameIgnoreCase(String roomCode, String nickname);
}

