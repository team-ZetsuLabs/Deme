package dev.zetsu.mission;

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
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "description_markdown", nullable = false, columnDefinition = "text")
    private String descriptionMarkdown;

    @Column(name = "description_html", nullable = false, columnDefinition = "text")
    private String descriptionHtml;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionKind kind;

    @Column(name = "budget_amount", nullable = false)
    private long budgetAmount;

    @Column(name = "budget_currency", nullable = false, length = 3)
    private String budgetCurrency;

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionStatus status = MissionStatus.OPEN;

    @ManyToMany
    @JoinTable(name = "mission_technologies",
            joinColumns = @JoinColumn(name = "mission_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderColumn(name = "position")
    private List<Tag> technologies = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Mission() {
    }

    public Mission(User author) {
        this.author = author;
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    /** Un membre retenu : plus de nouvelles propositions. */
    public void start() {
        if (status == MissionStatus.OPEN) {
            status = MissionStatus.IN_PROGRESS;
            touch();
        }
    }

    public void close() {
        if (status != MissionStatus.CLOSED) {
            status = MissionStatus.CLOSED;
            touch();
        }
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

    public String getDescriptionMarkdown() {
        return descriptionMarkdown;
    }

    public String getDescriptionHtml() {
        return descriptionHtml;
    }

    public void setDescription(String markdown, String safeHtml) {
        this.descriptionMarkdown = markdown;
        this.descriptionHtml = safeHtml;
    }

    public MissionKind getKind() {
        return kind;
    }

    public void setKind(MissionKind kind) {
        this.kind = kind;
    }

    public long getBudgetAmount() {
        return budgetAmount;
    }

    public String getBudgetCurrency() {
        return budgetCurrency;
    }

    public void setBudget(long amount, String currency) {
        this.budgetAmount = amount;
        this.budgetCurrency = currency;
    }

    public int getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(int durationDays) {
        this.durationDays = durationDays;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public MissionStatus getStatus() {
        return status;
    }

    public List<Tag> getTechnologies() {
        return technologies;
    }

    public void setTechnologies(Collection<Tag> technologies) {
        this.technologies.clear();
        this.technologies.addAll(technologies);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
