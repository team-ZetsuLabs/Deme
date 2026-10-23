package dev.zetsu.job;

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
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recruiter_id")
    private User recruiter;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "company_name", nullable = false, length = 80)
    private String companyName;

    @Column(name = "company_website", length = 200)
    private String companyWebsite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobType type;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(length = 80)
    private String city;

    @Column(name = "description_markdown", nullable = false, columnDefinition = "text")
    private String descriptionMarkdown;

    @Column(name = "description_html", nullable = false, columnDefinition = "text")
    private String descriptionHtml;

    @Column(length = 120)
    private String compensation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @ManyToMany
    @JoinTable(name = "job_technologies",
            joinColumns = @JoinColumn(name = "job_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderColumn(name = "position")
    private List<Tag> technologies = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Job() {
    }

    public Job(User recruiter) {
        this.recruiter = recruiter;
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    /** JOB-4 : toute modification repasse par la validation de l'équipe. */
    public void resubmit() {
        status = JobStatus.PENDING;
        rejectionReason = null;
        reviewedBy = null;
        reviewedAt = null;
        touch();
    }

    public void review(JobStatus decision, String reason, Long reviewerId) {
        status = decision;
        rejectionReason = reason;
        reviewedBy = reviewerId;
        reviewedAt = Instant.now();
        touch();
    }

    public void close() {
        status = JobStatus.CLOSED;
        touch();
    }

    public Long getId() {
        return id;
    }

    public User getRecruiter() {
        return recruiter;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyWebsite() {
        return companyWebsite;
    }

    public void setCompanyWebsite(String companyWebsite) {
        this.companyWebsite = companyWebsite;
    }

    public JobType getType() {
        return type;
    }

    public void setType(JobType type) {
        this.type = type;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
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

    public String getCompensation() {
        return compensation;
    }

    public void setCompensation(String compensation) {
        this.compensation = compensation;
    }

    public JobStatus getStatus() {
        return status;
    }

    public String getRejectionReason() {
        return rejectionReason;
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
