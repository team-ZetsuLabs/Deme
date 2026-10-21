package dev.zetsu.answer;

import dev.zetsu.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "answers")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false, updatable = false)
    private Long questionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(name = "body_markdown", nullable = false, columnDefinition = "text")
    private String bodyMarkdown;

    @Column(name = "body_html", nullable = false, columnDefinition = "text")
    private String bodyHtml;

    @Column(nullable = false, insertable = false, updatable = false)
    private int score;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Answer() {
    }

    public Answer(Long questionId, User author) {
        this.questionId = questionId;
        this.author = author;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public User getAuthor() {
        return author;
    }

    public String getBodyMarkdown() {
        return bodyMarkdown;
    }

    public String getBodyHtml() {
        return bodyHtml;
    }

    public void setBody(String markdown, String safeHtml) {
        this.bodyMarkdown = markdown;
        this.bodyHtml = safeHtml;
    }

    public int getScore() {
        return score;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
