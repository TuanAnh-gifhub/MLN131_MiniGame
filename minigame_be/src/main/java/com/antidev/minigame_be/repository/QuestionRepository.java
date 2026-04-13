package com.antidev.minigame_be.repository;

import com.antidev.minigame_be.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByActiveTrue();
    List<Question> findByActiveTrueAndRoomCode(String roomCode);
    List<Question> findByActiveTrueAndRoomCodeIsNull();
}

