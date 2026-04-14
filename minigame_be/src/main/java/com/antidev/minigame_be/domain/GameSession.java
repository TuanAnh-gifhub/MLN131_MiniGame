package com.antidev.minigame_be.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "game_sessions", indexes = {
    @Index(name = "idx_game_sessions_room_id", columnList = "room_id"),
    @Index(name = "idx_game_sessions_status", columnList = "status")
})
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GameSessionStatus status = GameSessionStatus.WAITING;

    @Column(name = "current_turn_player_id")
    private UUID currentTurnPlayerId;

    @Column(name = "total_rounds", nullable = false)
    private int totalRounds = 3;

    @Column(name = "current_round", nullable = false)
    private int currentRound = 1;

    @Column(name = "current_clue", length = 300, columnDefinition = "NVARCHAR(300)")
    private String currentClue;

    @Column(name = "current_answer", length = 200, columnDefinition = "NVARCHAR(200)")
    private String currentAnswer;

    @Column(name = "masked_answer", length = 200)
    private String maskedAnswer;

    @Column(name = "used_letters", length = 80)
    private String usedLetters;

    @Column(name = "current_spin_score")
    private Integer currentSpinScore;

    @Column(name = "spin_required", nullable = false)
    private boolean spinRequired = true;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "last_turn_at")
    private Instant lastTurnAt;

    @Column(name = "ended_at")
    private Instant endedAt;
}
