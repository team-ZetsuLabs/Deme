package dev.zetsu.reputation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Historique des gains et pertes de réputation : la réputation d'un membre est la somme de ses événements. */
@Entity
@Table(name = "reputation_events")
public class ReputationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private int delta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReputationReason reason;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "answer_id")
    private Long answerId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected ReputationEvent() {
    }

    public ReputationEvent(Long userId, int delta, ReputationReason reason, Long questionId, Long answerId) {
        this.userId = userId;
        this.delta = delta;
        this.reason = reason;
        this.questionId = questionId;
        this.answerId = answerId;
    }

    public int getDelta() {
        return delta;
    }

    public ReputationReason getReason() {
        return reason;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public Long getAnswerId() {
        return answerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
