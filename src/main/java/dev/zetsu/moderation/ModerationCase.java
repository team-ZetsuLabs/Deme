package dev.zetsu.moderation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Dossier de modération : tous les signalements d'un même contenu, et la dernière décision prise. */
@Entity
@Table(name = "moderation_cases")
public class ModerationCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "target_author_id", nullable = false)
    private Long targetAuthorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CaseStatus status = CaseStatus.OPEN;

    @Column(name = "report_count", nullable = false)
    private int reportCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_action", length = 20)
    private ModerationAction decisionAction;

    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "decided_by_team")
    private Boolean decidedByTeam;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(length = 1000)
    private String appeal;

    @Column(name = "appealed_at")
    private Instant appealedAt;

    @Column(name = "first_reported_at", nullable = false, updatable = false)
    private Instant firstReportedAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = firstReportedAt;

    protected ModerationCase() {
    }

    public void addReport() {
        reportCount++;
        updatedAt = Instant.now();
    }

    /** Masquage automatique (MOD-2) : le dossier reste à trancher par un Référent. */
    public void autoHide() {
        status = CaseStatus.HIDDEN;
        updatedAt = Instant.now();
    }

    public void decide(ModerationAction action, String note, Long deciderId, boolean byTeam, CaseStatus newStatus) {
        decisionAction = action;
        decisionNote = note;
        decidedBy = deciderId;
        decidedByTeam = byTeam;
        decidedAt = Instant.now();
        status = newStatus;
        updatedAt = decidedAt;
    }

    /** De nouveaux signalements après « ignorer » remettent le dossier dans la file, sans décision. */
    public void reopen() {
        decisionAction = null;
        decisionNote = null;
        decidedBy = null;
        decidedByTeam = null;
        decidedAt = null;
        status = CaseStatus.OPEN;
        updatedAt = Instant.now();
    }

    public void appeal(String message) {
        appeal = message;
        appealedAt = Instant.now();
        status = CaseStatus.APPEALED;
        updatedAt = appealedAt;
    }

    public Long getId() {
        return id;
    }

    public ReportTargetType getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public Long getTargetAuthorId() {
        return targetAuthorId;
    }

    public CaseStatus getStatus() {
        return status;
    }

    public int getReportCount() {
        return reportCount;
    }

    public ModerationAction getDecisionAction() {
        return decisionAction;
    }

    public String getDecisionNote() {
        return decisionNote;
    }

    public Boolean getDecidedByTeam() {
        return decidedByTeam;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public String getAppeal() {
        return appeal;
    }

    public Instant getFirstReportedAt() {
        return firstReportedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
