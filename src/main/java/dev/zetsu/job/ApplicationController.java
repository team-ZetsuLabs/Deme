package dev.zetsu.job;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.job.ApplicationDtos.ApplicationDecisionRequest;
import dev.zetsu.job.ApplicationDtos.MyApplication;
import dev.zetsu.job.ApplicationDtos.ReceivedApplication;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Suivi des candidatures et des propositions (JOB-7), communes aux offres et aux missions. */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "applications", description = "Candidatures aux offres et propositions sur les missions")
public class ApplicationController {

    @GetMapping("/users/me/applications")
    @Operation(summary = "Mes candidatures et propositions (JOB-7)", description = "Statut : envoyée, vue, retenue, refusée.")
    @ApiResponse(responseCode = "200", description = "Page, plus récentes d'abord")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<MyApplication> mine(@RequestParam(required = false) ApplicationTargetType type,
                                            @RequestParam(required = false) ApplicationStatus status,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size,
                                            @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PatchMapping("/applications/{id}")
    @Operation(summary = "Retenir ou refuser une candidature reçue",
            description = "Par le recruteur de l'offre ou l'auteur de la mission. Le candidat est notifié. "
                    + "Retenir une proposition passe la mission « IN_PROGRESS ».")
    @ApiResponse(responseCode = "200", description = "Candidature à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_STATUS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_TARGET_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "APPLICATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ReceivedApplication decide(@PathVariable Long id, @Valid @RequestBody ApplicationDecisionRequest req,
                                      @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/applications/{id}/cv")
    @Operation(summary = "Télécharger le CV joint",
            description = "Par le candidat ou le recruteur de l'offre. Réponse application/pdf, en pièce jointe.")
    @ApiResponse(responseCode = "200", description = "Le PDF", content = @Content(mediaType = "application/pdf"))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "APPLICATION_NOT_FOUND, CV_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Resource> cv(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }
}
