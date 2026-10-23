package dev.zetsu.challenge;

import dev.zetsu.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/** Dépôt d'un lien GitHub sur un défi (CH-2), puis note de l'équipe (CH-3). Un seul par membre et par défi. */
@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private User member;

    @Column(name = "repository_url", nullable = false, length = 200)
    private String repositoryUrl;

    @Column(length = 500)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubmissionStatus status = SubmissionStatus.PENDING;

    private Integer score;

    @Column(length = 1000)
    private String feedback;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected Submission() {
    }

    public Submission(Long challengeId, User member, String repositoryUrl, String comment) {
        this.challengeId = challengeId;
        this.member = member;
        this.repositoryUrl = repositoryUrl;
        this.comment = comment;
    }

    public void review(SubmissionStatus status, int score, String feedback, Long reviewerId) {
        this.status = status;
        this.score = score;
        this.feedback = feedback;
        this.reviewedBy = reviewerId;
        this.reviewedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getChallengeId() {
        return challengeId;
    }

    public User getMember() {
        return member;
    }

    public String getRepositoryUrl() {
        return repositoryUrl;
    }

    public String getComment() {
        return comment;
    }

    public SubmissionStatus getStatus() {
        return status;
    }

    public Integer getScore() {
        return score;
    }

    public String getFeedback() {
        return feedback;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }
}
