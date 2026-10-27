package dev.zetsu.project;

import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    /** Un lien de membre n'est accepté qu'en http ou https : jamais {@code javascript:}. */
    static final String HTTP_URL = "^https?://[^\\s<>\"']+$";
    static final String GITHUB_URL = "^https://github\\.com/[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)?/?$";

    @Schema(name = "ProjectRoleRequest", description = "Rôle recherché (PRJ-1)")
    public record RoleRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 3, max = 80, message = "Entre 3 et 80 caractères")
            @Schema(requiredMode = REQUIRED, example = "Développeur mobile Flutter") String title,
            @Size(max = 5, message = "5 technologies maximum")
            @Schema(example = "[\"flutter\", \"dart\"]") List<String> technologies) {
    }

    @Schema(name = "ProjectCreateRequest", description = "Publication d'un projet avec ses rôles (PRJ-1)")
    public record ProjectCreateRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 120, message = "Entre 10 et 120 caractères")
            @Schema(requiredMode = REQUIRED, example = "Application de cotisation de tontine en mobile money")
            String title,

            @NotBlank(message = "Obligatoire") @Size(min = 30, max = 10000, message = "Entre 30 et 10000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.") String description,

            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ProjectType type,

            @Size(max = 10, message = "10 technologies maximum")
            @Schema(example = "[\"flutter\", \"firebase\", \"orange-money\"]") List<String> technologies,

            @NotNull(message = "Obligatoire") @Size(min = 1, max = ProjectService.MAX_ROLES, message = "Entre 1 et 6 rôles")
            @Schema(requiredMode = REQUIRED) List<@Valid RoleRequest> roles,

            @Size(max = 200, message = "200 caractères maximum")
            @Pattern(regexp = GITHUB_URL, message = "Adresse de dépôt GitHub attendue (https://github.com/…)")
            @Schema(example = "https://github.com/tontine-cash/app") String githubUrl,

            @Size(max = 200, message = "200 caractères maximum")
            @Pattern(regexp = HTTP_URL, message = "Lien http ou https attendu")
            @Schema(example = "https://discord.gg/tontinecash",
                    description = "Discord, Telegram… Pas de messagerie interne : les échanges passent par ce lien.")
            String contactUrl) {
    }

    @Schema(name = "ProjectEditRequest", description = "Modification d'un projet ; les rôles se gèrent à part")
    public record ProjectEditRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 120, message = "Entre 10 et 120 caractères")
            @Schema(requiredMode = REQUIRED) String title,

            @NotBlank(message = "Obligatoire") @Size(min = 30, max = 10000, message = "Entre 30 et 10000 caractères")
            @Schema(requiredMode = REQUIRED) String description,

            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ProjectType type,

            @Size(max = 10, message = "10 technologies maximum") List<String> technologies,

            @Size(max = 200, message = "200 caractères maximum")
            @Pattern(regexp = GITHUB_URL, message = "Adresse de dépôt GitHub attendue (https://github.com/…)")
            String githubUrl,

            @Size(max = 200, message = "200 caractères maximum")
            @Pattern(regexp = HTTP_URL, message = "Lien http ou https attendu") String contactUrl) {
    }

    @Schema(name = "ProjectRole")
    public record RoleView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            @Schema(requiredMode = REQUIRED) RoleStatus status,
            @Schema(description = "Membre qui occupe le rôle, null s'il est ouvert") AuthorSummary member) {
    }

    @Schema(name = "ProjectTeamMember")
    public record TeamMember(
            @Schema(requiredMode = REQUIRED) AuthorSummary member,
            @Schema(example = "Développeur mobile Flutter", description = "Null pour le porteur") String roleTitle,
            @Schema(requiredMode = REQUIRED) boolean owner,
            @Schema(requiredMode = REQUIRED) Instant joinedAt) {
    }

    @Schema(name = "MyProjectRequestRef", description = "Dernière demande du membre connecté sur ce projet")
    public record MyRequestRef(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(description = "Null si le rôle a été retiré depuis") Long roleId,
            @Schema(requiredMode = REQUIRED) MemberStatus status) {
    }

    @Schema(name = "ProjectSummary", description = "Projet tel qu'affiché dans une liste (PRJ-2)")
    public record ProjectSummary(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED) ProjectType type,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            @Schema(requiredMode = REQUIRED) ProjectStatus status,
            @Schema(requiredMode = REQUIRED) AuthorSummary owner,
            @Schema(requiredMode = REQUIRED, example = "[\"Développeur mobile Flutter\", \"Designer UX\"]")
            List<String> openRoles,
            @Schema(requiredMode = REQUIRED, description = "Porteur compris") int teamSize,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant lastActivityAt) {
    }

    @Schema(name = "ProjectDetail", description = "Page d'un projet (PRJ-5)")
    public record ProjectDetail(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED, description = "Markdown d'origine, pour pré-remplir le formulaire d'édition")
            String descriptionMarkdown,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String descriptionHtml,
            @Schema(requiredMode = REQUIRED) ProjectType type,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            String githubUrl,
            String contactUrl,
            @Schema(requiredMode = REQUIRED) ProjectStatus status,
            @Schema(requiredMode = REQUIRED) AuthorSummary owner,
            @Schema(requiredMode = REQUIRED, description = "Rôles ouverts et pourvus") List<RoleView> roles,
            @Schema(requiredMode = REQUIRED, description = "Porteur d'abord, puis les membres par date d'arrivée")
            List<TeamMember> team,
            @Schema(description = "Null si le membre connecté n'a jamais demandé à rejoindre") MyRequestRef myRequest,
            @Schema(requiredMode = REQUIRED, description = "Vrai si le membre connecté est le porteur et le projet n'est pas clôturé")
            boolean canEdit,
            @Schema(requiredMode = REQUIRED, description = "Vrai si le membre connecté peut écrire dans le fil")
            boolean canPostUpdate,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt,
            @Schema(requiredMode = REQUIRED) Instant lastActivityAt) {
    }

    @Schema(name = "ProjectJoinRequest", description = "Demande pour rejoindre un rôle (PRJ-3)")
    public record JoinRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) Long roleId,
            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 500, message = "Entre 10 et 500 caractères")
            @Schema(requiredMode = REQUIRED, description = "Texte brut, affiché tel quel au porteur",
                    example = "Je fais du Flutter depuis deux ans, j'ai déjà intégré Wave et Orange Money.")
            String message) {
    }

    @Schema(name = "ProjectRequestDecision", description = "Décision du porteur (PRJ-4)")
    public record DecisionRequest(
            @NotNull(message = "Obligatoire")
            @Schema(requiredMode = REQUIRED, allowableValues = {"ACCEPTED", "REFUSED"}) MemberStatus status) {
    }

    @Schema(name = "ProjectMemberRemoval")
    public record RemovalRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 5, max = 300, message = "Entre 5 et 300 caractères")
            @Schema(requiredMode = REQUIRED, description = "Motif, montré au membre retiré") String reason) {
    }

    @Schema(name = "ReceivedProjectRequest", description = "Demande reçue par le porteur")
    public record ReceivedRequest(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(description = "Null si le rôle a été retiré depuis") Long roleId,
            @Schema(requiredMode = REQUIRED) String roleTitle,
            @Schema(requiredMode = REQUIRED) AuthorSummary candidate,
            @Schema(requiredMode = REQUIRED) String message,
            @Schema(requiredMode = REQUIRED) MemberStatus status,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            Instant decidedAt) {
    }

    @Schema(name = "MyProjectRequest", description = "Demande envoyée par le membre connecté")
    public record MyRequest(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) Long projectId,
            @Schema(requiredMode = REQUIRED) String projectTitle,
            @Schema(requiredMode = REQUIRED) String roleTitle,
            @Schema(requiredMode = REQUIRED) String message,
            @Schema(requiredMode = REQUIRED) MemberStatus status,
            @Schema(description = "Motif donné par le porteur s'il a retiré le membre") String removalReason,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            Instant decidedAt,
            Instant leftAt) {
    }

    @Schema(name = "ProjectUpdateRequest", description = "Message du fil de mises à jour (PRJ-5)")
    public record UpdatePost(
            @NotBlank(message = "Obligatoire") @Size(min = 5, max = 1000, message = "Entre 5 et 1000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Texte brut") String text) {
    }

    @Schema(name = "ProjectUpdate")
    public record UpdateView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED, description = "Texte brut, à afficher échappé") String text,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }
}
