package dev.zetsu.project;

import dev.zetsu.tag.Tag;
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

/** Rôle recherché par un projet : un seul membre par rôle. */
@Entity
@Table(name = "project_roles")
public class ProjectRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false, length = 80)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RoleStatus status = RoleStatus.OPEN;

    @ManyToMany
    @JoinTable(name = "project_role_technologies",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderColumn(name = "position")
    private List<Tag> technologies = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ProjectRole() {
    }

    ProjectRole(Project project, String title, Collection<Tag> technologies) {
        this.project = project;
        this.title = title;
        this.technologies.addAll(technologies);
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public String getTitle() {
        return title;
    }

    public RoleStatus getStatus() {
        return status;
    }

    void setStatus(RoleStatus status) {
        this.status = status;
    }

    public boolean isOpen() {
        return status == RoleStatus.OPEN;
    }

    public List<Tag> getTechnologies() {
        return technologies;
    }
}
