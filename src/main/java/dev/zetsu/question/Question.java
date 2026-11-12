package dev.zetsu.question;

import dev.zetsu.tag.Tag;
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
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Une question. {@code score} et {@code answerCount} sont dénormalisés et mis à jour par requêtes atomiques
 * (voir {@link QuestionRepository}). La colonne {@code search_vector} est calculée par PostgreSQL.
 */
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Masqué par la modération (MOD-2, MOD-3) : écrit seulement par ModerationService. */
    @Column(nullable = false, insertable = false, updatable = false)
    private boolean hidden;

    /** Supprimée par son auteur (QA-3) : écrit seulement par {@link QuestionRepository#softDelete}. */
    @Column(name = "deleted_at", insertable = false, updatable = false)
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "body_markdown", nullable = false, columnDefinition = "text")
    private String bodyMarkdown;

    @Column(name = "body_html", nullable = false, columnDefinition = "text")
    private String bodyHtml;

    /** Code facultatif, stocké en texte brut et coloré côté client (QA-1). */
    @Column(columnDefinition = "text")
    private String code;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "mobile_money_operator", length = 20)
    private MobileMoneyOperator mobileMoneyOperator;

    @Enumerated(EnumType.STRING)
    @Column(name = "network_quality", length = 20)
    private NetworkQuality networkQuality;

    @Column(name = "tech_version", length = 60)
    private String techVersion;

    /** Copie des noms d'étiquettes pour la recherche plein texte (QA-7). */
    @Column(name = "tags_text", nullable = false, length = 200)
    private String tagsText = "";

    @Column(nullable = false, insertable = false, updatable = false)
    private int score;

    @Column(name = "answer_count", nullable = false, insertable = false, updatable = false)
    private int answerCount;

    @Column(name = "accepted_answer_id")
    private Long acceptedAnswerId;

    @ManyToMany
    @JoinTable(name = "question_tags",
            joinColumns = @JoinColumn(name = "question_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderBy("name")
    private Set<Tag> tags = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Question() {
    }

    public Question(User author) {
        this.author = author;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public MobileMoneyOperator getMobileMoneyOperator() {
        return mobileMoneyOperator;
    }

    public void setMobileMoneyOperator(MobileMoneyOperator mobileMoneyOperator) {
        this.mobileMoneyOperator = mobileMoneyOperator;
    }

    public NetworkQuality getNetworkQuality() {
        return networkQuality;
    }

    public void setNetworkQuality(NetworkQuality networkQuality) {
        this.networkQuality = networkQuality;
    }

    public int getScore() {
        return score;
    }

    public int getAnswerCount() {
        return answerCount;
    }

    public Long getAcceptedAnswerId() {
        return acceptedAnswerId;
    }

    public void setAcceptedAnswerId(Long acceptedAnswerId) {
        this.acceptedAnswerId = acceptedAnswerId;
    }

    public Set<Tag> getTags() {
        return tags;
    }

    public void setTags(Set<Tag> tags) {
        this.tags.clear();
        this.tags.addAll(tags);
        this.tagsText = String.join(" ", tags.stream().map(Tag::getName).sorted().toList());
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTechVersion() {
        return techVersion;
    }

    public void setTechVersion(String techVersion) {
        this.techVersion = techVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isHidden() {
        return hidden;
    }
}
