package dev.zetsu.job;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.job.JobDtos.JobDetail;
import dev.zetsu.job.JobDtos.JobReviewRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Back office (MOD-4) : validation des offres par l'équipe. Réservé aux rôles Modérateur et Administrateur. */
@RestController
@RequestMapping("/api/v1/admin/jobs")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class JobAdminController {

    private final JobService jobService;

    public JobAdminController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    @Operation(summary = "Offres à valider (JOB-4)", description = "Par défaut les offres « PENDING », les plus anciennes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page d'offres")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<JobDetail> list(@RequestParam(defaultValue = "PENDING") JobStatus status,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size,
                                        @AuthenticationPrincipal ZetsuPrincipal me) {
        return jobService.reviewQueue(status, page, size, me);
    }

    @PostMapping("/{id}/decision")
    @Operation(summary = "Valider ou refuser une offre",
            description = "Le motif est obligatoire pour un refus. Le recruteur est notifié (JOB_REVIEWED).")
    @ApiResponse(responseCode = "200", description = "Offre publiée ou refusée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, REASON_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "JOB_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "JOB_NOT_PENDING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public JobDetail decide(@PathVariable Long id, @Valid @RequestBody JobReviewRequest req,
                            @AuthenticationPrincipal ZetsuPrincipal me) {
        return jobService.decide(id, req, me);
    }
}
