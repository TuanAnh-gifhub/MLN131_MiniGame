package com.antidev.minigame_be.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "rooms", indexes = {
    @Index(name = "idx_rooms_code", columnList = "code", unique = true),
    @Index(name = "idx_rooms_status", columnList = "status")
})
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 12)
    private String code;

    @Column(name = "host_nickname", nullable = false, length = 30)
    private String hostNickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoomStatus status = RoomStatus.WAITING;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}

