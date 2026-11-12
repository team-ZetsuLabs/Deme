package dev.zetsu.playtest;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.playtest.PlaytestDtos.AdminPlaytestSummary;
import dev.zetsu.playtest.PlaytestDtos.EventView;
import dev.zetsu.playtest.PlaytestDtos.NoteRequest;
import dev.zetsu.playtest.PlaytestDtos.ParticipationView;
import dev.zetsu.playtest.PlaytestDtos.PlaytestDetail;
import dev.zetsu.playtest.PlaytestDtos.Problem;
import dev.zetsu.playtest.PlaytestDtos.RemoveRequest;
import dev.zetsu.playtest.PlaytestDtos.ReviewRequest;
import dev.zetsu.playtest.PlaytestDtos.Stats;
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

import java.util.List;

/** Back office des tests fermés (TST-5, TST-6), pour l'équipe (Modérateur, Administrateur). */
@RestController
@RequestMapping("/api/v1/admin/playtests")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class PlaytestAdminController {

    private final PlaytestAdminService admin;

    public PlaytestAdminController(PlaytestAdminService admin) {
        this.admin = admin;
    }

    @GetMapping
    @Operation(summary = "Campagnes de test fermé (TST-5)", description = """
            Toutes sauf les brouillons, celles en attente de validation d'abord. problem=INACTIVE : active sans \
            participation depuis 7 jours ; STALLED : plus de 30 % des testeurs en cours « à confirmer » ; \
            REPORTED : masquée par la modération.""")
    @ApiResponse(responseCode = "200", description = "Page de campagnes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AdminPlaytestSummary> list(@RequestParam(required = false) CampaignStatus status,
                                                   @RequestParam(required = false) Problem problem,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        return admin.list(status, problem, page, size);
    }

    @GetMapping("/stats")
    @Operation(summary = "Indicateurs des tests fermés (TST-6)")
    @ApiResponse(responseCode = "200", description = "Indicateurs")
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Stats stats() {
        return admin.stats();
    }

    @PostMapping("/{id}/review")
    @Operation(summary = "Valider ou refuser une campagne", description = "Motif obligatoire pour REJECT, montré au porteur. Validée, la campagne est annoncée aux membres qui font du mobile.")
    @ApiResponse(responseCode = "200", description = "Campagne à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, NOTE_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_PENDING, PACKAGE_ALREADY_RUNNING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail review(@PathVariable Long id, @Valid @RequestBody ReviewRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        return admin.review(id, req.decision(), req.note(), me);
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspendre une campagne", description = "Motif obligatoire. Plus de nouveaux testeurs ; le décompte de ceux en cours continue.")
    @ApiResponse(responseCode = "200", description = "Campagne suspendue")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, NOTE_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_ACTIVE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail suspend(@PathVariable Long id, @Valid @RequestBody NoteRequest req,
                                  @AuthenticationPrincipal ZetsuPrincipal me) {
        return admin.suspend(id, req.note(), me);
    }

    @PostMapping("/{id}/reactivate")
    @Operation(summary = "Réactiver une campagne suspendue")
    @ApiResponse(responseCode = "200", description = "Campagne active")
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_SUSPENDED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail reactivate(@PathVariable Long id, @Valid @RequestBody(required = false) NoteRequest req,
                                     @AuthenticationPrincipal ZetsuPrincipal me) {
        return admin.reactivate(id, req == null ? null : req.note(), me);
    }

    @GetMapping("/{id}/participations")
    @Operation(summary = "Testeurs d'une campagne", description = "Adresses Google comprises.")
    @ApiResponse(responseCode = "200", description = "Tous les testeurs, partis compris")
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<ParticipationView> participations(@PathVariable Long id) {
        return admin.participations(id);
    }

    @PostMapping("/{id}/participations/{participationId}/remove")
    @Operation(summary = "Retirer un testeur", description = """
            Motif montré au testeur ; le porteur est prévenu. Pour « réaffecter » un testeur, on le retire ici puis il \
            rejoint une autre campagne : un compteur ne passe jamais d'une application à une autre.""")
    @ApiResponse(responseCode = "200", description = "Testeurs à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND, PARTICIPATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PARTICIPATION_NOT_RUNNING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<ParticipationView> remove(@PathVariable Long id, @PathVariable Long participationId,
                                          @Valid @RequestBody RemoveRequest req,
                                          @AuthenticationPrincipal ZetsuPrincipal me) {
        return admin.remove(id, participationId, req.reason(), me);
    }

    @GetMapping("/{id}/events")
    @Operation(summary = "Historique d'une campagne", description = "Plus récent d'abord.")
    @ApiResponse(responseCode = "200", description = "Page d'événements")
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<EventView> events(@PathVariable Long id, @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return admin.events(id, page, size);
    }
}
