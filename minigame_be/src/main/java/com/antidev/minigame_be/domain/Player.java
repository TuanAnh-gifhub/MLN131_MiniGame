package com.antidev.minigame_be.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "players", indexes = {
    @Index(name = "idx_players_room_id", columnList = "room_id"),
    @Index(name = "idx_players_room_nickname", columnList = "room_id,nickname")
})
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false)
    private int score = 0;

    @Column(name = "is_host", nullable = false)
    private boolean host;

    @Column(nullable = false)
    private boolean ready = false;

    @Column(nullable = false)
    private boolean connected = true;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt = Instant.now();
}

