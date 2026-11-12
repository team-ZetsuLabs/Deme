package dev.zetsu.question;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Image jointe à une question (QA-11). Sans question tant que celle-ci n'est pas publiée. */
@Entity
@Table(name = "question_images")
public class QuestionImage {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "uploader_id", nullable = false, updatable = false)
    private Long uploaderId;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "storage_ref", nullable = false, updatable = false, length = 300)
    private String storageRef;

    @Column(nullable = false, updatable = false, length = 500)
    private String url;

    @Column(nullable = false)
    private int position;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected QuestionImage() {
    }

    QuestionImage(String id, Long uploaderId, String storageRef, String url) {
        this.id = id;
        this.uploaderId = uploaderId;
        this.storageRef = storageRef;
        this.url = url;
    }

    void attach(Long questionId, int position) {
        this.questionId = questionId;
        this.position = position;
    }

    public String getId() {
        return id;
    }

    public Long getUploaderId() {
        return uploaderId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public String getStorageRef() {
        return storageRef;
    }

    public String getUrl() {
        return url;
    }

    public int getPosition() {
        return position;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
