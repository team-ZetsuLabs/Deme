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

import java.time.Duration;
import java.time.Instant;

/** Participation d'un testeur à une campagne (TST-2, TST-3). */
@Entity
@Table(name = "test_participations")
public class TestParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "campaign_id")
    private TestCampaign campaign;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tester_id")
    private User tester;

    @Column(name = "google_email", length = 254)
    private String googleEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipationStatus status = ParticipationStatus.JOINED;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(name = "last_check_in_at")
    private Instant lastCheckInAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "dropped_at")
    private Instant droppedAt;

    @Column(name = "drop_reason", length = 300)
    private String dropReason;

    @Column(name = "replaces_id")
    private Long replacesId;

    @Column(name = "install_reminded", nullable = false)
    private boolean installReminded;

    @Column(name = "stay_reminded_at")
    private Instant stayRemindedAt;

    @Column(name = "ending_notified", nullable = false)
    private boolean endingNotified;

    protected TestParticipation() {
    }

    public TestParticipation(TestCampaign campaign, User tester, Long replacesId, Instant now) {
        this.campaign = campaign;
        this.tester = tester;
        this.replacesId = replacesId;
        this.joinedAt = now;
    }

    /** Déclaration d'installation : le décompte des jours part d'ici. Sans décompte (web), pas de date de fin. */
    void confirm(String googleEmail, Instant now) {
        this.status = ParticipationStatus.CONFIRMED;
        this.googleEmail = googleEmail;
        this.confirmedAt = now;
        this.lastCheckInAt = now;
        this.endsAt = tracked() ? now.plus(Duration.ofDays(campaign.getRequiredDays())) : null;
    }

    /** Campagne avec décompte jour par jour (Google Play, App Store). */
    boolean tracked() {
        return campaign.getTracking() == Tracking.DAILY;
    }

    void verify(Long ownerId, Instant now) {
        this.status = ParticipationStatus.VERIFIED;
        this.verifiedAt = now;
        this.verifiedBy = ownerId;
    }

    void checkIn(Instant now) {
        this.lastCheckInAt = now;
        this.stayRemindedAt = null;
    }

    void complete(Instant now) {
        this.status = ParticipationStatus.COMPLETED;
        this.completedAt = now;
    }

    void stop(ParticipationStatus status, String reason, Instant now) {
        this.status = status;
        this.dropReason = reason;
        this.droppedAt = now;
    }

    void markInstallReminded() {
        this.installReminded = true;
    }

    void markStayReminded(Instant now) {
        this.stayRemindedAt = now;
    }

    void markEndingNotified() {
        this.endingNotified = true;
    }

    /**
     * Jours entiers effectués depuis la déclaration d'installation, plafonnés aux jours requis. Sans décompte (web) :
     * jours entre l'installation et la fin de la participation, sans plafond.
     */
    public int daysDone(Instant now) {
        if (confirmedAt == null) {
            return 0;
        }
        if (!tracked()) {
            Instant until = completedAt != null ? completedAt : droppedAt != null ? droppedAt : now;
            return (int) Math.max(0, Duration.between(confirmedAt, until).toDays());
        }
        if (status == ParticipationStatus.COMPLETED) {
            return campaign.getRequiredDays();
        }
        Instant until = droppedAt != null ? droppedAt : now;
        long days = Duration.between(confirmedAt, until).toDays();
        return (int) Math.max(0, Math.min(campaign.getRequiredDays(), days));
    }

    public ProofLevel proofLevel() {
        return switch (status) {
            case CONFIRMED -> ProofLevel.DECLARED;
            case VERIFIED -> ProofLevel.VERIFIED;
            case COMPLETED -> ProofLevel.COMPLETED;
            default -> null;
        };
    }

    /** Sans « toujours inscrit » depuis 3 jours : signalée « à confirmer » au porteur. */
    public boolean needsAttention(Instant now) {
        return tracked() && status.counting() && lastCheckInAt != null
                && lastCheckInAt.isBefore(now.minus(PlaytestRules.STAY_REMINDER_AFTER));
    }

    public Long getId() {
        return id;
    }

    public TestCampaign getCampaign() {
        return campaign;
    }

    public User getTester() {
        return tester;
    }

    public String getGoogleEmail() {
        return googleEmail;
    }

    public ParticipationStatus getStatus() {
        return status;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public Instant getLastCheckInAt() {
        return lastCheckInAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getDroppedAt() {
        return droppedAt;
    }

    public String getDropReason() {
        return dropReason;
    }

    public Long getReplacesId() {
        return replacesId;
    }

    public boolean isInstallReminded() {
        return installReminded;
    }

    public Instant getStayRemindedAt() {
        return stayRemindedAt;
    }

    public boolean isEndingNotified() {
        return endingNotified;
    }
}
