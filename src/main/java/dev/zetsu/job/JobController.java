package dev.zetsu.job;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.job.ApplicationDtos.ReceivedApplication;
import dev.zetsu.job.ApplicationDtos.MyApplication;
import dev.zetsu.job.JobDtos.JobDetail;
import dev.zetsu.job.JobDtos.JobRequest;
import dev.zetsu.job.JobDtos.JobSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Contrat du sprint 2 (JOB-1 à JOB-4) : publié avant le code, les fronts travaillent sur les mocks. */
@RestController
@RequestMapping("/api/v1/jobs")
@Tag(name = "jobs", description = "Offres d'emploi, validées par l'équipe avant publication")
public class JobController {

    @GetMapping
    @Operation(summary = "Liste des offres publiées (JOB-1)",
            description = "Plus récentes d'abord. Avec une session, chaque offre porte sa correspondance avec la stack du membre.")
    @ApiResponse(responseCode = "200", description = "Page d'offres")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE, INVALID_PARAMETER, INVALID_COUNTRY",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<JobSummary> list(
            @RequestParam(required = false) JobType type,
            @Parameter(description = "Code pays ISO, ex. SN") @RequestParam(required = false) String country,
            @Parameter(description = "Nom de technologie exact, ex. spring-boot") @RequestParam(required = false) String technology,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/mine")
    @Operation(summary = "Offres publiées par le recruteur connecté, tous statuts confondus")
    @ApiResponse(responseCode = "200", description = "Page d'offres, plus récentes d'abord")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<JobSummary> mine(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size,
                                         @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une offre (JOB-2)",
            description = "Une offre en attente ou refusée n'est visible que par son recruteur et l'équipe.")
    @ApiResponse(responseCode = "200", description = "L'offre")
    @ApiResponse(responseCode = "404", description = "JOB_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public JobDetail get(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Publier une offre (JOB-4)",
            description = "Réservé au rôle Recruteur, attribué par l'équipe. L'offre est créée « PENDING ».")
    @ApiResponse(responseCode = "201", description = "Offre créée, en attente de validation")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, TAG_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "RECRUITER_ONLY", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public JobDetail create(@Valid @RequestBody JobRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier son offre", description = "Renvoie l'offre « PENDING » pour une nouvelle validation.")
    @ApiResponse(responseCode = "200", description = "Offre modifiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, TAG_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_JOB_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "JOB_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "JOB_CLOSED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public JobDetail update(@PathVariable Long id, @Valid @RequestBody JobRequest req,
                            @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Clore son offre", description = "Elle disparaît de la liste ; les candidatures restent consultables.")
    @ApiResponse(responseCode = "200", description = "Offre close")
    @ApiResponse(responseCode = "403", description = "NOT_JOB_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "JOB_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public JobDetail close(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping(value = "/{id}/applications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Postuler à une offre (JOB-3)",
            description = "Formulaire multipart : message (40 à 2000 caractères) et CV PDF facultatif de 2 Mo maximum. "
                    + "Le profil Zetsu du membre est transmis au recruteur. Une seule candidature par offre.")
    @ApiResponse(responseCode = "201", description = "Candidature envoyée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, CV_NOT_PDF, CV_TOO_LARGE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "CANNOT_APPLY_OWN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "JOB_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "ALREADY_APPLIED, JOB_CLOSED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MyApplication apply(@PathVariable Long id,
                               @Parameter(description = "40 à 2000 caractères") @RequestPart String message,
                               @Parameter(description = "CV au format PDF, 2 Mo maximum")
                               @RequestPart(required = false) MultipartFile cv,
                               @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/{id}/applications")
    @Operation(summary = "Candidatures reçues sur son offre",
            description = "Les candidatures encore « SENT » passent « VIEWED » quand le recruteur les liste (JOB-7).")
    @ApiResponse(responseCode = "200", description = "Page de candidatures, plus récentes d'abord")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_JOB_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "JOB_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ReceivedApplication> applications(@PathVariable Long id,
                                                          @RequestParam(required = false) ApplicationStatus status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size,
                                                          @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }
}
