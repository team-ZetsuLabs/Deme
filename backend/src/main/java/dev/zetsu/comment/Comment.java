package dev.zetsu.comment;

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

/** Commentaire court (QA-9), sous une question ou sous une réponse. */
@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", updatable = false)
    private Long questionId;

    @Column(name = "answer_id", updatable = false)
    private Long answerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(name = "body_markdown", nullable = false, columnDefinition = "text")
    private String bodyMarkdown;

    @Column(name = "body_html", nullable = false, columnDefinition = "text")
    private String bodyHtml;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Comment() {
    }

    private Comment(User author, String markdown, String safeHtml) {
        this.author = author;
        this.bodyMarkdown = markdown;
        this.bodyHtml = safeHtml;
    }

    static Comment onQuestion(Long questionId, User author, String markdown, String safeHtml) {
        Comment c = new Comment(author, markdown, safeHtml);
        c.questionId = questionId;
        return c;
    }

    static Comment onAnswer(Long answerId, User author, String markdown, String safeHtml) {
        Comment c = new Comment(author, markdown, safeHtml);
        c.answerId = answerId;
        return c;
    }

    public Long getId() {
        return id;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public Long getAnswerId() {
        return answerId;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
