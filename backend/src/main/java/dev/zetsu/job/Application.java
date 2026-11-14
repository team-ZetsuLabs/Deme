package dev.zetsu.job;

import dev.zetsu.mission.Mission;
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

/** Candidature à une offre (JOB-3) ou proposition sur une mission (JOB-5) : exactement l'une des deux cibles. */
@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id")
    private User candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id")
    private Mission mission;

    @Column(nullable = false, length = 2000)
    private String message;

    /** Nom du fichier dans le dossier des CV, généré par {@link CvStorage}. */
    @Column(name = "cv_file", length = 60)
    private String cvFile;

    @Column(name = "proposed_amount")
    private Long proposedAmount;

    @Column(name = "proposed_currency", length = 3)
    private String proposedCurrency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.SENT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Application() {
    }

    public static Application forJob(User candidate, Job job, String message, String cvFile) {
        Application a = new Application();
        a.candidate = candidate;
        a.job = job;
        a.message = message;
        a.cvFile = cvFile;
        return a;
    }

    public static Application forMission(User candidate, Mission mission, String message, Long proposedAmount,
                                         String proposedCurrency) {
        Application a = new Application();
        a.candidate = candidate;
        a.mission = mission;
        a.message = message;
        a.proposedAmount = proposedAmount;
        a.proposedCurrency = proposedCurrency;
        return a;
    }

    /** JOB-7 : « vue » dès que le destinataire l'a sous les yeux, sans revenir en arrière après une décision. */
    public void markViewed() {
        if (status == ApplicationStatus.SENT) {
            setStatus(ApplicationStatus.VIEWED);
        }
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getCandidate() {
        return candidate;
    }

    public Job getJob() {
        return job;
    }

    public Mission getMission() {
        return mission;
    }

    public String getMessage() {
        return message;
    }

    public String getCvFile() {
        return cvFile;
    }

    public Long getProposedAmount() {
        return proposedAmount;
    }

    public String getProposedCurrency() {
        return proposedCurrency;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
