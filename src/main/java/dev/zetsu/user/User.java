package dev.zetsu.user;

import dev.zetsu.tag.Tag;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    public static final String DELETED_NAME = "Utilisateur supprimé";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Masqué par la modération (MOD-2, MOD-3) : écrit seulement par ModerationService. */
    @Column(nullable = false, insertable = false, updatable = false)
    private boolean hidden;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(length = 200)
    private String bio;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(length = 80)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(nullable = false, length = 2)
    private String language = "fr";

    @Column(name = "visible_to_recruiters", nullable = false)
    private boolean visibleToRecruiters;

    @Column(nullable = false)
    private int reputation;

    @ManyToMany
    @JoinTable(name = "user_technologies",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @OrderColumn(name = "position")
    private List<Tag> technologies = new ArrayList<>();

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected User() {
    }

    public User(String username, String displayName) {
        this.username = username;
        this.displayName = displayName;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public boolean isVisibleToRecruiters() {
        return visibleToRecruiters;
    }

    public void setVisibleToRecruiters(boolean visibleToRecruiters) {
        this.visibleToRecruiters = visibleToRecruiters;
    }

    public int getReputation() {
        return reputation;
    }

    public List<Tag> getTechnologies() {
        return technologies;
    }

    public void setTechnologies(Collection<Tag> technologies) {
        this.technologies.clear();
        this.technologies.addAll(technologies);
    }

    public Instant getOnboardedAt() {
        return onboardedAt;
    }

    public void setOnboardedAt(Instant onboardedAt) {
        this.onboardedAt = onboardedAt;
    }

    public boolean isDeleted() {
        return status == UserStatus.DELETED;
    }

    /**
     * AUTH-6 : la ligne reste pour que les questions et réponses gardent leur auteur, mais plus rien ne permet
     * de retrouver la personne. Le pseudo contient un tiret, ce que {@link UsernameGenerator} ne produit jamais.
     */
    public void anonymize() {
        username = "deleted-" + id;
        displayName = DELETED_NAME;
        email = null;
        passwordHash = null;
        emailVerified = false;
        avatarUrl = null;
        bio = null;
        countryCode = null;
        city = null;
        role = Role.MEMBER;
        status = UserStatus.DELETED;
        visibleToRecruiters = false;
        reputation = 0;
        technologies.clear();
        deletedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isHidden() {
        return hidden;
    }
}
