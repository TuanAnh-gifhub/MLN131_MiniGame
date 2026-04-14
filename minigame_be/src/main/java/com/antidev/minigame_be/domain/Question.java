package com.antidev.minigame_be.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "questions", indexes = {
    @Index(name = "idx_questions_category", columnList = "category"),
    @Index(name = "idx_questions_room_code", columnList = "room_code")
})
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 300, columnDefinition = "NVARCHAR(300)")
    private String clue;

    @Column(nullable = false, length = 200, columnDefinition = "NVARCHAR(200)")
    private String answer;

    @Column(name = "room_code", length = 12)
    private String roomCode;

    @Column(nullable = false)
    private boolean active = true;
}
