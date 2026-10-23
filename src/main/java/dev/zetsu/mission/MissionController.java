package dev.zetsu.mission;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.CountryCode;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.job.ApplicationService;
import dev.zetsu.job.ApplicationDtos.MissionApplicationRequest;
import dev.zetsu.job.ApplicationDtos.MyApplication;
import dev.zetsu.job.ApplicationDtos.ReceivedApplication;
import dev.zetsu.job.ApplicationStatus;
import dev.zetsu.mission.MissionDtos.MissionDetail;
import dev.zetsu.mission.MissionDtos.MissionRequest;
import dev.zetsu.mission.MissionDtos.MissionSummary;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** JOB-5 : missions courtes entre pairs, dans leur propre onglet, distinct des offres. */
@RestController
@RequestMapping("/api/v1/missions")
@Tag(name = "missions", description = "Missions courtes entre pairs : dépannage, intégration, revue de code")
public class MissionController {

    private final MissionService missionService;
    private final ApplicationService applicationService;
    private final RateLimiter rateLimiter;

    public MissionController(MissionService missionService, ApplicationService applicationService,
                             RateLimiter rateLimiter) {
        this.missionService = missionService;
        this.applicationService = applicationService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping
    @Operation(summary = "Liste des missions", description = "Par défaut les missions ouvertes, plus récentes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de missions")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE, INVALID_PARAMETER, INVALID_COUNTRY",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<MissionSummary> list(
            @RequestParam(required = false) MissionKind kind,
            @Parameter(description = "Code pays ISO, ex. CI") @RequestParam(required = false) String country,
            @Parameter(description = "Nom de technologie exact") @RequestParam(required = false) String technology,
            @Parameter(description = "Pseudo de l'auteur") @RequestParam(required = false) String author,
            @RequestParam(defaultValue = "OPEN") MissionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (country != null && !CountryCode.ISO_CODES.contains(country)) {
            throw ApiException.badRequest("INVALID_COUNTRY", "Code pays inconnu");
        }
        return missionService.list(new MissionSearch.Criteria(status, kind, country,
                technology == null ? null : TagService.normalize(technology), author), page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une mission")
    @ApiResponse(responseCode = "200", description = "La mission")
    @ApiResponse(responseCode = "404", description = "MISSION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MissionDetail get(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return missionService.get(id, me);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Publier une mission (JOB-5)", description = "Ouvert à tout membre connecté, publiée tout de suite.")
    @ApiResponse(responseCode = "201", description = "Mission publiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MissionDetail create(@Valid @RequestBody MissionRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return missionService.create(req, me);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier sa mission", description = "Seulement tant qu'elle est ouverte.")
    @ApiResponse(responseCode = "200", description = "Mission modifiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_MISSION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "MISSION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "MISSION_NOT_OPEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MissionDetail update(@PathVariable Long id, @Valid @RequestBody MissionRequest req,
                                @AuthenticationPrincipal ZetsuPrincipal me) {
        return missionService.update(id, req, me);
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Clore sa mission", description = "Terminée ou abandonnée ; plus aucune proposition acceptée.")
    @ApiResponse(responseCode = "200", description = "Mission close")
    @ApiResponse(responseCode = "403", description = "NOT_MISSION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "MISSION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MissionDetail close(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return missionService.close(id, me);
    }

    @PostMapping("/{id}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Se proposer sur une mission", description = "Une seule proposition par membre et par mission.")
    @ApiResponse(responseCode = "201", description = "Proposition envoyée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "CANNOT_APPLY_OWN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "MISSION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "ALREADY_APPLIED, MISSION_NOT_OPEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MyApplication apply(@PathVariable Long id, @Valid @RequestBody MissionApplicationRequest req,
                               @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return applicationService.applyToMission(id, req, me);
    }

    @GetMapping("/{id}/applications")
    @Operation(summary = "Propositions reçues sur sa mission",
            description = "Les propositions encore « SENT » passent « VIEWED » quand l'auteur les liste (JOB-7).")
    @ApiResponse(responseCode = "200", description = "Page de propositions, plus récentes d'abord")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_MISSION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "MISSION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ReceivedApplication> applications(@PathVariable Long id,
                                                          @RequestParam(required = false) ApplicationStatus status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size,
                                                          @AuthenticationPrincipal ZetsuPrincipal me) {
        return applicationService.receivedForMission(id, status, page, size, me);
    }
}
