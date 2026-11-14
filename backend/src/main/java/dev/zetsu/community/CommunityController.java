package dev.zetsu.community;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.community.CommunityDtos.CommunityDetail;
import dev.zetsu.community.CommunityDtos.CommunityProposalView;
import dev.zetsu.community.CommunityDtos.CommunityRequest;
import dev.zetsu.community.CommunityDtos.CommunitySummary;
import dev.zetsu.community.CommunityDtos.MembershipResult;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Communautés par pays ou par technologie (COM-1) et propositions des Référents (COM-2). Idée de l'équipe, hors cahier. */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "communities", description = "Communautés par pays ou par technologie")
public class CommunityController {

    private final CommunityService communityService;
    private final CommunityProposalService proposalService;

    public CommunityController(CommunityService communityService, CommunityProposalService proposalService) {
        this.communityService = communityService;
        this.proposalService = proposalService;
    }

    @GetMapping("/communities")
    @Operation(summary = "Liste des communautés (COM-1)",
            description = "Communautés ouvertes, les plus grandes d'abord. Publique ; joined vaut false sans session. "
                    + "q cherche dans le nom, l'étiquette et l'adresse (« senegal » trouve « Sénégal »).")
    @ApiResponse(responseCode = "200", description = "Page de communautés")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE, INVALID_PARAMETER",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<CommunitySummary> list(
            @RequestParam(required = false) CommunityKind kind,
            @Parameter(description = "Texte recherché") @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal ZetsuPrincipal me) {
        String text = q == null ? null : q.length() > 100 ? q.substring(0, 100) : q;
        return communityService.list(kind, text, page, size, me);
    }

    @GetMapping("/communities/{slug}")
    @Operation(summary = "Page d'une communauté (COM-1)",
            description = "Ses questions s'obtiennent avec GET /questions?community={slug}.")
    @ApiResponse(responseCode = "200", description = "Communauté")
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND (inconnue ou fermée)",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CommunityDetail get(@PathVariable String slug, @AuthenticationPrincipal ZetsuPrincipal me) {
        return communityService.get(slug, me);
    }

    @PostMapping("/communities/{slug}/members")
    @Operation(summary = "Rejoindre une communauté", description = "Ouvert à tous les niveaux. Sans effet si déjà membre.")
    @ApiResponse(responseCode = "200", description = "Membre")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MembershipResult join(@PathVariable String slug, @AuthenticationPrincipal ZetsuPrincipal me) {
        return communityService.join(slug, me);
    }

    @DeleteMapping("/communities/{slug}/members")
    @Operation(summary = "Quitter une communauté", description = "Sans effet si déjà hors de la communauté.")
    @ApiResponse(responseCode = "200", description = "Plus membre")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMUNITY_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MembershipResult leave(@PathVariable String slug, @AuthenticationPrincipal ZetsuPrincipal me) {
        return communityService.leave(slug, me);
    }

    @GetMapping("/users/me/communities")
    @Operation(summary = "Mes communautés", description = "Communautés ouvertes rejointes, la plus récente d'abord.")
    @ApiResponse(responseCode = "200", description = "Communautés du membre")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<CommunitySummary> mine(@AuthenticationPrincipal ZetsuPrincipal me) {
        return communityService.mine(me);
    }

    @PostMapping("/community-proposals")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Proposer une communauté (COM-2)",
            description = "Réservé au niveau Référent. La proposition est créée « PENDING » ; l'équipe l'accepte ou la "
                    + "refuse avec un motif, et le Référent reçoit COMMUNITY_PROPOSAL_DECISION.")
    @ApiResponse(responseCode = "201", description = "Proposition en attente")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "LEVEL_TOO_LOW", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "COMMUNITY_EXISTS : communauté ou proposition en attente avec ce "
            + "nom, ce pays ou cette étiquette", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CommunityProposalView propose(@Valid @RequestBody CommunityRequest req,
                                         @AuthenticationPrincipal ZetsuPrincipal me) {
        return proposalService.propose(req, me);
    }

    @GetMapping("/users/me/community-proposals")
    @Operation(summary = "Mes propositions de communauté (COM-2)", description = "La plus récente d'abord.")
    @ApiResponse(responseCode = "200", description = "Propositions du membre")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<CommunityProposalView> myProposals(@AuthenticationPrincipal ZetsuPrincipal me) {
        return proposalService.mine(me);
    }
}
