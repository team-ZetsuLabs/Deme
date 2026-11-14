package dev.zetsu.community;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.community.CommunityDtos.AdminCommunity;
import dev.zetsu.community.CommunityDtos.AdminCommunityProposal;
import dev.zetsu.community.CommunityDtos.CommunityRequest;
import dev.zetsu.community.CommunityDtos.ProposalReviewRequest;
import dev.zetsu.community.CommunityDtos.ReferentsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Back office : communautés (COM-1) et file des propositions (COM-2). Réservé aux rôles Modérateur et Administrateur. */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class CommunityAdminController {

    private final CommunityService communityService;
    private final CommunityProposalService proposalService;

    public CommunityAdminController(CommunityService communityService, CommunityProposalService proposalService) {
        this.communityService = communityService;
        this.proposalService = proposalService;
    }

    @GetMapping("/communities")
    @Operation(summary = "Communautés, ouvertes et fermées", description = "Sans status : toutes. Les plus grandes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de communautés")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AdminCommunity> list(@RequestParam(required = false) CommunityStatus status,
                                             @RequestParam(required = false) CommunityKind kind,
                                             @Parameter(description = "Texte recherché") @RequestParam(required = false) String q,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return communityService.adminList(status, kind, q, page, size);
    }

    @PostMapping("/communities")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une communauté",
            description = "L'adresse (slug) vient du nom, sans accent, et ne change plus. L'étiquette d'une communauté "
                    + "de techno est créée si elle n'existe pas.")
    @ApiResponse(responseCode = "201", description = "Communauté ouverte")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "COMMUNITY_EXISTS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminCommunity create(@Valid @RequestBody CommunityRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        return communityService.create(req, me);
    }

    @PutMapping("/communities/{slug}")
    @Operation(summary = "Modifier une communauté", description = "Modification complète ; l'adresse ne change pas.")
    @ApiResponse(responseCode = "200", description = "Communauté modifiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "COMMUNITY_EXISTS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminCommunity update(@PathVariable String slug, @Valid @RequestBody CommunityRequest req) {
        return communityService.update(slug, req);
    }

    @PostMapping("/communities/{slug}/close")
    @Operation(summary = "Fermer une communauté",
            description = "Elle disparaît des listes et de sa page (404) ; ses questions restent dans le fil. "
                    + "Membres et Référents sont gardés pour une réouverture.")
    @ApiResponse(responseCode = "200", description = "Communauté fermée")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminCommunity close(@PathVariable String slug) {
        return communityService.setStatus(slug, CommunityStatus.CLOSED);
    }

    @PostMapping("/communities/{slug}/reopen")
    @Operation(summary = "Rouvrir une communauté fermée")
    @ApiResponse(responseCode = "200", description = "Communauté ouverte")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminCommunity reopen(@PathVariable String slug) {
        return communityService.setStatus(slug, CommunityStatus.OPEN);
    }

    @PutMapping("/communities/{slug}/referents")
    @Operation(summary = "Nommer les Référents d'une communauté",
            description = "Remplace la liste, dans l'ordre d'affichage. Chacun doit avoir le niveau Référent "
                    + "(section 8) et devient membre de la communauté.")
    @ApiResponse(responseCode = "200", description = "Référents enregistrés")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, NOT_A_REFERENT", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND, USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminCommunity referents(@PathVariable String slug, @Valid @RequestBody ReferentsRequest req) {
        return communityService.setReferents(slug, req.usernames());
    }

    @GetMapping("/community-proposals")
    @Operation(summary = "Propositions de communauté (COM-2)", description = "Par défaut « PENDING », les plus anciennes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de propositions")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AdminCommunityProposal> proposals(@RequestParam(defaultValue = "PENDING") ProposalStatus status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return proposalService.queue(status, page, size);
    }

    @PostMapping("/community-proposals/{id}/decision")
    @Operation(summary = "Accepter ou refuser une proposition",
            description = "Accepter crée la communauté ; le proposeur en devient le premier Référent et membre. Le motif "
                    + "est obligatoire pour un refus. Le Référent reçoit COMMUNITY_PROPOSAL_DECISION.")
    @ApiResponse(responseCode = "200", description = "Proposition acceptée ou refusée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, REASON_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROPOSAL_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PROPOSAL_NOT_PENDING, COMMUNITY_EXISTS (créée entre-temps : à refuser)",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminCommunityProposal decide(@PathVariable Long id, @Valid @RequestBody ProposalReviewRequest req,
                                         @AuthenticationPrincipal ZetsuPrincipal me) {
        return proposalService.decide(id, req, me);
    }
}
