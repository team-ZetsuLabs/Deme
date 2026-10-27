package dev.zetsu.project;

import dev.zetsu.tag.Tag;
import dev.zetsu.user.User;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Masqué par la modération (MOD-2, MOD-3) : écrit seulement par ModerationService. */
    @Column(nullable = false, insertable = false, updatable = false)
    private boolean hidden;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "description_markdown", nullable = false, columnDefinition = "text")
    private String descriptionMarkdown;

    @Column(name = "description_html", nullable = false, columnDefinition = "text")
    private String descriptionHtml;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectType type;

    @Column(name = "github_url", length = 200)
    private String githubUrl;

    @Column(name = "contact_url", length = 200)
    private String contactUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.OPEN;

    @ManyToMany
    @JoinTable(name = "project_technologies",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderColumn(name = "position")
    private List<Tag> technologies = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<ProjectRole> roles = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    @Column(name = "last_activity_at", nullable = false)
    private Instant lastActivityAt = createdAt;

    protected Project() {
    }

    public Project(User owner) {
        this.owner = owner;
    }

    public void touch() {
        updatedAt = Instant.now();
        lastActivityAt = updatedAt;
    }

    /**
     * Une action de l'équipe : le projet n'est plus en pause, et son état suit ses rôles (OPEN s'il en reste un
     * d'ouvert, IN_PROGRESS sinon). Sans effet sur un projet clôturé.
     */
    public void activity() {
        if (status == ProjectStatus.CLOSED) {
            return;
        }
        status = roles.stream().anyMatch(ProjectRole::isOpen) ? ProjectStatus.OPEN : ProjectStatus.IN_PROGRESS;
        touch();
    }

    public void close() {
        status = ProjectStatus.CLOSED;
        touch();
    }

    public ProjectRole addRole(String title, Collection<Tag> technologies) {
        ProjectRole role = new ProjectRole(this, title, technologies);
        roles.add(role);
        return role;
    }

    public void removeRole(ProjectRole role) {
        roles.remove(role);
    }

    public Long getId() {
        return id;
    }

    public User getOwner() {
        return owner;
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

    public ProjectType getType() {
        return type;
    }

    public void setType(ProjectType type) {
        this.type = type;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public String getContactUrl() {
        return contactUrl;
    }

    public void setLinks(String githubUrl, String contactUrl) {
        this.githubUrl = githubUrl;
        this.contactUrl = contactUrl;
    }

    public ProjectStatus getStatus() {
        return status;
    }

    public List<Tag> getTechnologies() {
        return technologies;
    }

    public void setTechnologies(Collection<Tag> technologies) {
        this.technologies.clear();
        this.technologies.addAll(technologies);
    }

    public List<ProjectRole> getRoles() {
        return roles;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getLastActivityAt() {
        return lastActivityAt;
    }

    public boolean isHidden() {
        return hidden;
    }
}
