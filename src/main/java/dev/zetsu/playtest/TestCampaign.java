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
import java.time.LocalDate;

/** Campagne de test fermé (TST-1), Google Play, App Store ou web (TST-7). */
@Entity
@Table(name = "test_campaigns")
public class TestCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Platform platform = Platform.GOOGLE_PLAY;

    @Column(name = "app_name", nullable = false, length = 80)
    private String appName;

    /** Identifiant Android ou Bundle ID ; null pour une application web. */
    @Column(name = "package_name", length = 150)
    private String packageName;

    @Column(name = "description_markdown", nullable = false, columnDefinition = "text")
    private String descriptionMarkdown;

    @Column(name = "description_html", nullable = false, columnDefinition = "text")
    private String descriptionHtml;

    @Column(name = "icon_url", length = 300)
    private String iconUrl;

    @Column(name = "opt_in_url", nullable = false, length = 300)
    private String optInUrl;

    @Column(name = "testers_target", nullable = false)
    private int testersTarget = 14;

    @Column(name = "required_days", nullable = false)
    private int requiredDays = 14;

    @Column(name = "desired_start")
    private LocalDate desiredStart;

    @Column(length = 2000)
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampaignStatus status = CampaignStatus.DRAFT;

    @Column(name = "review_note", length = 300)
    private String reviewNote;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    /** Masquée par la modération (MOD-2, MOD-3) : écrit seulement par ModerationService. */
    @Column(nullable = false, insertable = false, updatable = false)
    private boolean hidden;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TestCampaign() {
    }

    public TestCampaign(User owner, Instant now) {
        this.owner = owner;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void edit(Platform platform, String appName, String packageName, String markdown, String safeHtml,
              String optInUrl, int testersTarget, int requiredDays, LocalDate desiredStart, String instructions,
              Instant now) {
        this.platform = platform;
        this.requiredDays = requiredDays;
        this.appName = appName;
        this.packageName = packageName;
        this.descriptionMarkdown = markdown;
        this.descriptionHtml = safeHtml;
        this.optInUrl = optInUrl;
        this.testersTarget = testersTarget;
        this.desiredStart = desiredStart;
        this.instructions = instructions;
        // Une campagne refusée qu'on corrige redevient un brouillon, à renvoyer.
        if (status == CampaignStatus.REJECTED) {
            status = CampaignStatus.DRAFT;
        }
        this.updatedAt = now;
    }

    void setStatus(CampaignStatus status, Instant now) {
        this.status = status;
        this.updatedAt = now;
        if (status == CampaignStatus.ACTIVE && startedAt == null) {
            startedAt = now;
        }
        if (status == CampaignStatus.COMPLETED) {
            completedAt = now;
        }
    }

    void review(Long reviewerId, String note, Instant now) {
        this.reviewedBy = reviewerId;
        this.reviewedAt = now;
        this.reviewNote = note;
    }

    void setIconUrl(String iconUrl, Instant now) {
        this.iconUrl = iconUrl;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public User getOwner() {
        return owner;
    }

    public Platform getPlatform() {
        return platform;
    }

    public Tracking getTracking() {
        return platform.tracking();
    }

    public String getAppName() {
        return appName;
    }

    public String getPackageName() {
        return packageName;
    }

    public String getDescriptionMarkdown() {
        return descriptionMarkdown;
    }

    public String getDescriptionHtml() {
        return descriptionHtml;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public String getOptInUrl() {
        return optInUrl;
    }

    public int getTestersTarget() {
        return testersTarget;
    }

    public int getRequiredDays() {
        return requiredDays;
    }

    public LocalDate getDesiredStart() {
        return desiredStart;
    }

    public String getInstructions() {
        return instructions;
    }

    public CampaignStatus getStatus() {
        return status;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public boolean isHidden() {
        return hidden;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
