package dev.zetsu.challenge;

import dev.zetsu.tag.Tag;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/** Un défi (CH-1). Son statut se déduit de ses dates et de l'heure du serveur. */
@Entity
@Table(name = "challenges")
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "statement_markdown", nullable = false)
    private String statementMarkdown;

    @Column(name = "statement_html", nullable = false)
    private String statementHtml;

    @Column(name = "specifications_markdown", nullable = false)
    private String specificationsMarkdown;

    @Column(name = "specifications_html", nullable = false)
    private String specificationsHtml;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "start_notified", nullable = false)
    private boolean startNotified;

    @ManyToMany
    @JoinTable(name = "challenge_technologies",
            joinColumns = @JoinColumn(name = "challenge_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderColumn(name = "position")
    private List<Tag> technologies = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Challenge() {
    }

    public Challenge(Long createdBy) {
        this.createdBy = createdBy;
    }

    public ChallengeStatus statusAt(Instant now) {
        if (now.isBefore(startsAt)) {
            return ChallengeStatus.UPCOMING;
        }
        return now.isBefore(endsAt) ? ChallengeStatus.OPEN : ChallengeStatus.CLOSED;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setStatement(String markdown, String html) {
        this.statementMarkdown = markdown;
        this.statementHtml = html;
    }

    public void setSpecifications(String markdown, String html) {
        this.specificationsMarkdown = markdown;
        this.specificationsHtml = html;
    }

    public void setPeriod(Instant startsAt, Instant endsAt) {
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public void setTechnologies(Collection<Tag> technologies) {
        this.technologies.clear();
        this.technologies.addAll(technologies);
    }

    public boolean isStartNotified() {
        return startNotified;
    }

    public void markStartNotified() {
        this.startNotified = true;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getStatementMarkdown() {
        return statementMarkdown;
    }

    public String getStatementHtml() {
        return statementHtml;
    }

    public String getSpecificationsMarkdown() {
        return specificationsMarkdown;
    }

    public String getSpecificationsHtml() {
        return specificationsHtml;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public List<Tag> getTechnologies() {
        return technologies;
    }
}
