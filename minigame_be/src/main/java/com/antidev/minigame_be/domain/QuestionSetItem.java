package com.antidev.minigame_be.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "question_set_items", indexes = {
    @Index(name = "idx_qsi_set_id", columnList = "question_set_id")
})
public class QuestionSetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_set_id", nullable = false)
    private QuestionSet questionSet;

    @Column(nullable = false, length = 100, columnDefinition = "nvarchar(100)")
    private String category;

    @Column(nullable = false, length = 300, columnDefinition = "nvarchar(300)")
    private String clue;

    @Column(nullable = false, length = 200, columnDefinition = "nvarchar(200)")
    private String answer;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;
}
