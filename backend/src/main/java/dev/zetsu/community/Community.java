package dev.zetsu.community;

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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "communities")
public class Community {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40, updatable = false)
    private String slug;

    @Column(nullable = false, length = 40)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CommunityKind kind;

    /** Rempli pour une communauté de pays. */
    @Column(name = "country_code", length = 2)
    private String countryCode;

    /** Rempli pour une communauté de techno : l'étiquette de ses questions. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id")
    private Tag tag;

    @Column(nullable = false, length = 200)
    private String description;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false, columnDefinition = "text[]")
    private List<String> rules = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CommunityStatus status = CommunityStatus.OPEN;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = createdAt;

    protected Community() {
    }

    public Community(String slug, Long createdBy) {
        this.slug = slug;
        this.createdBy = createdBy;
    }

    /** Le pays et l'étiquette s'excluent : on fixe les deux en même temps que le type. */
    public void setScope(CommunityKind kind, String countryCode, Tag tag) {
        this.kind = kind;
        this.countryCode = kind == CommunityKind.COUNTRY ? countryCode : null;
        this.tag = kind == CommunityKind.TECH ? tag : null;
    }

    public void setStatus(CommunityStatus status) {
        this.status = status;
        touch();
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public CommunityKind getKind() {
        return kind;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public Tag getTag() {
        return tag;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getRules() {
        return rules;
    }

    public void setRules(Collection<String> rules) {
        this.rules = new ArrayList<>(rules);
    }

    public CommunityStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
