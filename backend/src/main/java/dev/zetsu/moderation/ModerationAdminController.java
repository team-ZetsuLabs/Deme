package dev.zetsu.moderation;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.moderation.ModerationDtos.CaseDecisionRequest;
import dev.zetsu.moderation.ModerationDtos.ModerationCase;
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

/** Back office (MOD-4) : signalements et contestations, tranchés par l'équipe (Modérateur, Administrateur). */
@RestController
@RequestMapping("/api/v1/admin/cases")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class ModerationAdminController {

    private final ModerationService moderationService;

    public ModerationAdminController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @GetMapping
    @Operation(summary = "Signalements et contestations",
            description = "Sans filtre : les dossiers « APPEALED » d'abord, puis ceux sans décision, les plus "
                    + "signalés d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de dossiers")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ModerationCase> list(@RequestParam(required = false) CaseStatus status,
                                             @RequestParam(required = false) ReportTargetType targetType,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return moderationService.teamList(status, targetType, page, size);
    }

    @PostMapping("/{id}/decision")
    @Operation(summary = "Trancher un dossier",
            description = "Toutes les actions : ignorer, masquer, rétablir (contestation acceptée), avertir ou "
                    + "suspendre l'auteur (le contenu est aussi masqué). Le motif est obligatoire sauf pour DISMISS "
                    + "et RESTORE. Peut revenir sur la décision d'un Référent. L'annulation pendant 6 secondes se "
                    + "fait côté front, avant l'envoi.")
    @ApiResponse(responseCode = "200", description = "Dossier à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, NOTE_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN, CANNOT_SUSPEND_STAFF", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "CASE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ModerationCase decide(@PathVariable Long id, @Valid @RequestBody CaseDecisionRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        return moderationService.teamDecide(id, req, me);
    }
}
