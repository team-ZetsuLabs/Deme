package dev.zetsu.vote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Un vote d'un membre sur une question ou une réponse : +1 ou -1, un seul par membre et par contenu. */
@Entity
@Table(name = "votes")
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voter_id", nullable = false)
    private Long voterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 10)
    private VoteTarget targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false)
    private short value;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Vote() {
    }

    public Vote(Long voterId, VoteTarget targetType, Long targetId, int value) {
        this.voterId = voterId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.value = (short) value;
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = (short) value;
        this.createdAt = Instant.now();
    }

    public Long getTargetId() {
        return targetId;
    }
}
