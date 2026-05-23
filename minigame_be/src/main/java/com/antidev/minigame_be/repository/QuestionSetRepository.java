package com.antidev.minigame_be.repository;

import com.antidev.minigame_be.domain.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, UUID> {
    List<QuestionSet> findAllByOrderByCreatedAtDesc();
}
