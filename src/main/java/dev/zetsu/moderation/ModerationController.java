package dev.zetsu.moderation;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.moderation.ModerationDtos.AppealRequest;
import dev.zetsu.moderation.ModerationDtos.CaseDecisionRequest;
import dev.zetsu.moderation.ModerationDtos.ModerationCase;
import dev.zetsu.moderation.ModerationDtos.MyModeratedContent;
import dev.zetsu.moderation.ModerationDtos.ReportReceipt;
import dev.zetsu.moderation.ModerationDtos.ReportRequest;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrat du sprint 3 : modération par la communauté (MOD-1 à MOD-3). Les niveaux sont ceux de la section 8 :
 * signaler à partir de Membre, voir la file à partir de Contributeur, décider à partir de Référent.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "moderation", description = "Signalements et file des Référents")
public class ModerationController {

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Signaler un contenu (MOD-1)",
            description = "À partir du niveau Membre. Un signalement par membre et par contenu. Au 5e signalement de "
                    + "comptes distincts, le contenu est masqué pour tous sauf son auteur (MOD-2) ; le seuil est "
                    + "dans la configuration.")
    @ApiResponse(responseCode = "201", description = "Signalement enregistré")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "LEVEL_TOO_LOW, CANNOT_REPORT_OWN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "TARGET_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "ALREADY_REPORTED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ReportReceipt report(@Valid @RequestBody ReportRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/moderation/cases")
    @Operation(summary = "File des signalements (MOD-3)",
            description = "À partir du niveau Contributeur (lecture) ; seul un Référent peut décider. Les dossiers "
                    + "sans décision (« OPEN », ou « HIDDEN » après un masquage automatique), les plus signalés "
                    + "d'abord. Un membre ne voit jamais les dossiers de ses propres contenus.")
    @ApiResponse(responseCode = "200", description = "Page de dossiers")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "LEVEL_TOO_LOW", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ModerationCase> queue(@RequestParam(required = false) ReportTargetType targetType,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/moderation/cases/{id}/decision")
    @Operation(summary = "Ignorer ou masquer un contenu signalé (MOD-3)",
            description = "Réservé aux Référents, et seulement DISMISS ou HIDE (le motif est obligatoire pour HIDE). "
                    + "La décision est enregistrée et l'auteur est notifié ; il peut la contester devant l'équipe.")
    @ApiResponse(responseCode = "200", description = "Dossier à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, NOTE_REQUIRED, ACTION_NOT_ALLOWED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "LEVEL_TOO_LOW, CANNOT_MODERATE_OWN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "CASE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "CASE_ALREADY_DECIDED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ModerationCase decide(@PathVariable Long id, @Valid @RequestBody CaseDecisionRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/moderation/cases/{id}/appeal")
    @Operation(summary = "Contester le masquage de son contenu",
            description = "Par l'auteur du contenu, une seule fois par dossier. Le dossier passe « APPEALED » et "
                    + "arrive dans le back office de l'équipe.")
    @ApiResponse(responseCode = "200", description = "Contestation enregistrée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "CASE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "CASE_NOT_HIDDEN, ALREADY_APPEALED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MyModeratedContent appeal(@PathVariable Long id, @Valid @RequestBody AppealRequest req,
                                     @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/users/me/moderation")
    @Operation(summary = "Mes contenus masqués",
            description = "Contenus du membre connecté masqués, contestés ou rétablis, avec la décision et la "
                    + "possibilité de contester. Les plus récents d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de contenus")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<MyModeratedContent> mine(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size,
                                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }
}
