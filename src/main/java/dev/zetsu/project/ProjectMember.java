package dev.zetsu.project;

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

/** Demande pour rejoindre un rôle (PRJ-3) ; acceptée, c'est l'appartenance à l'équipe (PRJ-4). */
@Entity
@Table(name = "project_members")
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    /** Null si le porteur a retiré le rôle ; {@link #roleTitle} garde son intitulé. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private ProjectRole role;

    @Column(name = "role_title", nullable = false, length = 80)
    private String roleTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MemberStatus status = MemberStatus.PENDING;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "removal_reason", length = 300)
    private String removalReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    protected ProjectMember() {
    }

    public ProjectMember(Project project, User user, ProjectRole role, String message) {
        this.project = project;
        this.user = user;
        this.role = role;
        this.roleTitle = role.getTitle();
        this.message = message;
    }

    void decide(MemberStatus decision) {
        status = decision;
        decidedAt = Instant.now();
        if (decision == MemberStatus.ACCEPTED) {
            role.setStatus(RoleStatus.FILLED);
        }
    }

    /** Départ ou retrait : le rôle se rouvre. */
    void leave(String reason) {
        status = MemberStatus.LEFT;
        leftAt = Instant.now();
        removalReason = reason;
        if (role != null) {
            role.setStatus(RoleStatus.OPEN);
        }
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public User getUser() {
        return user;
    }

    public ProjectRole getRole() {
        return role;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public MemberStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public String getRemovalReason() {
        return removalReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public Instant getLeftAt() {
        return leftAt;
    }
}
