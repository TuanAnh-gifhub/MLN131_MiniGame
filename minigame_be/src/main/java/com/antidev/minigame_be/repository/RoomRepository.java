package com.antidev.minigame_be.repository;

import com.antidev.minigame_be.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByCode(String code);
}

