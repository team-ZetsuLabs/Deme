package dev.zetsu.playtest;

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

/** Retour d'un testeur au porteur d'une campagne. */
@Entity
@Table(name = "test_feedback")
public class TestFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_id", nullable = false, updatable = false)
    private Long campaignId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackKind kind;

    private Integer rating;

    @Column(name = "body_markdown", nullable = false, columnDefinition = "text")
    private String bodyMarkdown;

    @Column(name = "body_html", nullable = false, columnDefinition = "text")
    private String bodyHtml;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TestFeedback() {
    }

    TestFeedback(Long campaignId, User author, FeedbackKind kind, Integer rating, String markdown, String safeHtml,
                 Instant now) {
        this.campaignId = campaignId;
        this.author = author;
        this.kind = kind;
        this.rating = rating;
        this.bodyMarkdown = markdown;
        this.bodyHtml = safeHtml;
        this.createdAt = now;
    }

    public Long getId() {
        return id;
    }

    public Long getCampaignId() {
        return campaignId;
    }

    public User getAuthor() {
        return author;
    }

    public FeedbackKind getKind() {
        return kind;
    }

    public Integer getRating() {
        return rating;
    }

    public String getBodyMarkdown() {
        return bodyMarkdown;
    }

    public String getBodyHtml() {
        return bodyHtml;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
