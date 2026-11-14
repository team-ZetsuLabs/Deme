package dev.zetsu.project;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.project.ProjectDtos.DecisionRequest;
import dev.zetsu.project.ProjectDtos.JoinRequest;
import dev.zetsu.project.ProjectDtos.MyRequest;
import dev.zetsu.project.ProjectDtos.ProjectCreateRequest;
import dev.zetsu.project.ProjectDtos.ProjectDetail;
import dev.zetsu.project.ProjectDtos.ProjectEditRequest;
import dev.zetsu.project.ProjectDtos.ProjectSummary;
import dev.zetsu.project.ProjectDtos.ReceivedRequest;
import dev.zetsu.project.ProjectDtos.RemovalRequest;
import dev.zetsu.project.ProjectDtos.RoleRequest;
import dev.zetsu.project.ProjectDtos.UpdatePost;
import dev.zetsu.project.ProjectDtos.UpdateView;
import dev.zetsu.tag.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Espace Projets (PRJ-1 à PRJ-6) : un projet est une équipe dans la durée, une mission un service ponctuel. */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "projects", description = "Espace Projets : publier un projet, constituer son équipe")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectRequestService requestService;
    private final RateLimiter rateLimiter;

    public ProjectController(ProjectService projectService, ProjectRequestService requestService,
                             RateLimiter rateLimiter) {
        this.projectService = projectService;
        this.requestService = requestService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/projects")
    @Operation(summary = "Liste des projets (PRJ-2)", description = """
            Par défaut tous les projets sauf les clôturés, les plus actifs d'abord. member liste les projets d'un \
            membre (porteur ou membre accepté), clôturés compris, pour son profil.""")
    @ApiResponse(responseCode = "200", description = "Page de projets")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE, INVALID_PARAMETER",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ProjectSummary> list(
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) ProjectType type,
            @Parameter(description = "Nom de technologie exact, du projet ou d'un rôle") @RequestParam(required = false)
            String technology,
            @Parameter(description = "Texte cherché dans l'intitulé des rôles ouverts") @RequestParam(required = false)
            String role,
            @Parameter(description = "Seulement les projets qui recrutent") @RequestParam(defaultValue = "false")
            boolean openRoles,
            @Parameter(description = "Pseudo d'un membre : ses projets") @RequestParam(required = false) String member,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String roleText = role == null ? null : role.length() > 80 ? role.substring(0, 80) : role;
        return projectService.list(new ProjectSearch.Criteria(status, type,
                technology == null ? null : TagService.normalize(technology), roleText, openRoles, member), page, size);
    }

    @GetMapping("/projects/mine")
    @Operation(summary = "Mes projets", description = """
            Projets dont le membre connecté est porteur ou membre accepté, clôturés compris, les plus actifs             d'abord. Même résultat que GET /projects?member=<mon pseudo>.""")
    @ApiResponse(responseCode = "200", description = "Page de projets")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ProjectSummary> mine(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size,
                                             @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.list(new ProjectSearch.Criteria(null, null, null, null, false, me.getUsername()),
                page, size);
    }

    @GetMapping("/projects/{id}")
    @Operation(summary = "Page d'un projet (PRJ-5)", description = "Équipe, rôles pourvus et ouverts. Le fil : GET /projects/{id}/updates.")
    @ApiResponse(responseCode = "200", description = "Le projet")
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail get(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.get(id, me);
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Publier un projet (PRJ-1)", description = "Ouvert à tout membre connecté, de 1 à 6 rôles.")
    @ApiResponse(responseCode = "201", description = "Projet publié")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail create(@Valid @RequestBody ProjectCreateRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return projectService.create(req, me);
    }

    @PutMapping("/projects/{id}")
    @Operation(summary = "Modifier son projet", description = "Sans les rôles, qui se gèrent à part. Relance un projet en pause.")
    @ApiResponse(responseCode = "200", description = "Projet modifié")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail edit(@PathVariable Long id, @Valid @RequestBody ProjectEditRequest req,
                              @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.edit(id, req, me);
    }

    @PostMapping("/projects/{id}/roles")
    @Operation(summary = "Ajouter un rôle recherché", description = "6 rôles au plus par projet.")
    @ApiResponse(responseCode = "200", description = "Projet avec le nouveau rôle")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED, TOO_MANY_ROLES", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail addRole(@PathVariable Long id, @Valid @RequestBody RoleRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.addRole(id, req, me);
    }

    @DeleteMapping("/projects/{id}/roles/{roleId}")
    @Operation(summary = "Retirer un rôle ouvert", description = "Les demandes en attente sur ce rôle sont refusées.")
    @ApiResponse(responseCode = "200", description = "Projet sans ce rôle")
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND, ROLE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED, ROLE_FILLED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail removeRole(@PathVariable Long id, @PathVariable Long roleId,
                                    @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.removeRole(id, roleId, me);
    }

    @PostMapping("/projects/{id}/close")
    @Operation(summary = "Clôturer son projet (PRJ-6)", description = """
            Définitif. Chaque membre accepté gagne 10 points et le projet reste sur son profil ; les demandes en \
            attente sont refusées.""")
    @ApiResponse(responseCode = "200", description = "Projet clôturé")
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail close(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.close(id, me);
    }

    @PostMapping("/projects/{id}/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Demander à rejoindre un rôle (PRJ-3)",
            description = "Une seule demande en attente par membre et par projet. Le porteur est notifié.")
    @ApiResponse(responseCode = "201", description = "Demande envoyée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "CANNOT_JOIN_OWN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND, ROLE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_NOT_OPEN, ROLE_FILLED, ALREADY_REQUESTED, ALREADY_MEMBER",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MyRequest request(@PathVariable Long id, @Valid @RequestBody JoinRequest req,
                             @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return requestService.request(id, req, me);
    }

    @GetMapping("/projects/{id}/requests")
    @Operation(summary = "Demandes reçues sur son projet", description = "Plus récentes d'abord ; status filtre.")
    @ApiResponse(responseCode = "200", description = "Page de demandes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ReceivedRequest> requests(@PathVariable Long id,
                                                  @RequestParam(required = false) MemberStatus status,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size,
                                                  @AuthenticationPrincipal ZetsuPrincipal me) {
        return requestService.received(id, status, page, size, me);
    }

    @PatchMapping("/projects/{id}/requests/{requestId}")
    @Operation(summary = "Accepter ou refuser une demande (PRJ-4)", description = """
            Le candidat est notifié. Acceptée, le rôle passe « Pourvu » et les autres demandes en attente sur ce \
            rôle sont refusées.""")
    @ApiResponse(responseCode = "200", description = "Demande décidée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_STATUS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND, REQUEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED, REQUEST_NOT_PENDING, ROLE_FILLED, TEAM_FULL",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ReceivedRequest decide(@PathVariable Long id, @PathVariable Long requestId,
                                  @Valid @RequestBody DecisionRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        return requestService.decide(id, requestId, req.status(), me);
    }

    @DeleteMapping("/projects/{id}/requests/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Retirer sa demande en attente sur ce projet",
            description = "Comme DELETE /projects/{id}/requests/{requestId}, sans avoir à connaître l'identifiant.")
    @ApiResponse(responseCode = "204", description = "Demande retirée")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "REQUEST_NOT_FOUND : aucune demande en attente", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void withdrawMine(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        requestService.withdrawMine(id, me);
    }

    @DeleteMapping("/projects/{id}/requests/{requestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Retirer sa demande", description = "Seulement tant qu'elle est en attente.")
    @ApiResponse(responseCode = "204", description = "Demande retirée")
    @ApiResponse(responseCode = "403", description = "NOT_REQUEST_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "REQUEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "REQUEST_NOT_PENDING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void withdraw(@PathVariable Long id, @PathVariable Long requestId, @AuthenticationPrincipal ZetsuPrincipal me) {
        requestService.withdraw(id, requestId, me);
    }

    @PostMapping("/projects/{id}/leave")
    @Operation(summary = "Quitter l'équipe", description = "Le rôle se rouvre.")
    @ApiResponse(responseCode = "200", description = "Projet à jour")
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED, NOT_PROJECT_MEMBER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail leave(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return requestService.leave(id, me);
    }

    @PostMapping("/projects/{id}/members/{username}/remove")
    @Operation(summary = "Retirer un membre de l'équipe", description = "Avec un motif, montré au membre. Le rôle se rouvre.")
    @ApiResponse(responseCode = "200", description = "Projet à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND, MEMBER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ProjectDetail removeMember(@PathVariable Long id, @PathVariable String username,
                                      @Valid @RequestBody RemovalRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        return requestService.remove(id, username, req.reason(), me);
    }

    @GetMapping("/projects/{id}/updates")
    @Operation(summary = "Fil de mises à jour (PRJ-5)", description = "Plus récentes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de mises à jour")
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<UpdateView> updates(@PathVariable Long id,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size,
                                            @AuthenticationPrincipal ZetsuPrincipal me) {
        return projectService.updates(id, page, size, me);
    }

    @PostMapping("/projects/{id}/updates")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Écrire dans le fil", description = "Porteur et membres acceptés. Relance un projet en pause.")
    @ApiResponse(responseCode = "201", description = "Mise à jour publiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PROJECT_MEMBER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROJECT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROJECT_CLOSED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UpdateView postUpdate(@PathVariable Long id, @Valid @RequestBody UpdatePost req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return projectService.postUpdate(id, req, me);
    }

    @GetMapping("/users/me/project-requests")
    @Operation(summary = "Mes demandes pour rejoindre des projets", description = "Plus récentes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de demandes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<MyRequest> myRequests(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              @AuthenticationPrincipal ZetsuPrincipal me) {
        return requestService.mine(page, size, me);
    }
}
