package dev.zetsu.community;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/** COM-2 : proposition d'un Référent, acceptée (la communauté est alors créée) ou refusée avec un motif. */
@Entity
@Table(name = "community_proposals")
public class CommunityProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposer_id", updatable = false)
    private User proposer;

    @Column(nullable = false, length = 40)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CommunityKind kind;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "tag_name", length = 30)
    private String tagName;

    @Column(nullable = false, length = 200)
    private String description;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private List<String> rules = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ProposalStatus status = ProposalStatus.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected CommunityProposal() {
    }

    public CommunityProposal(User proposer, String name, CommunityKind kind, String countryCode, String tagName,
                             String description, Collection<String> rules) {
        this.proposer = proposer;
        this.name = name;
        this.kind = kind;
        this.countryCode = kind == CommunityKind.COUNTRY ? countryCode : null;
        this.tagName = kind == CommunityKind.TECH ? tagName : null;
        this.description = description;
        this.rules = new ArrayList<>(rules);
    }

    public void approve(Community created, Long reviewerId) {
        status = ProposalStatus.APPROVED;
        community = created;
        rejectionReason = null;
        reviewed(reviewerId);
    }

    public void reject(String reason, Long reviewerId) {
        status = ProposalStatus.REJECTED;
        rejectionReason = reason;
        reviewed(reviewerId);
    }

    private void reviewed(Long reviewerId) {
        reviewedBy = reviewerId;
        reviewedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getProposer() {
        return proposer;
    }

    public String getName() {
        return name;
    }

    public CommunityKind getKind() {
        return kind;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public String getTagName() {
        return tagName;
    }

    public String getDescription() {
        return description;
    }

    public List<String> getRules() {
        return rules;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public Community getCommunity() {
        return community;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
