package dev.zetsu.playtest;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.playtest.PlaytestDtos.Availability;
import dev.zetsu.playtest.PlaytestDtos.ConfirmRequest;
import dev.zetsu.playtest.PlaytestDtos.MyPlaytestEntry;
import dev.zetsu.playtest.PlaytestDtos.ParticipationView;
import dev.zetsu.playtest.PlaytestDtos.PlaytestDetail;
import dev.zetsu.playtest.PlaytestDtos.PlaytestRequest;
import dev.zetsu.playtest.PlaytestDtos.PlaytestSummary;
import dev.zetsu.playtest.PlaytestDtos.RemoveRequest;
import dev.zetsu.playtest.PlaytestDtos.WithdrawRequest;
import dev.zetsu.user.UserDtos.AvatarForm;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

import java.time.Duration;
import java.util.List;

/**
 * Tests fermés (TST-1 à TST-4, TST-7) : un développeur réunit des testeurs avant de publier, sur Google Play, l'App
 * Store ou le web.
 * Zetsu ne peut rien vérifier chez les stores : les compteurs sont des déclarations, jamais une conformité.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "playtests", description = "Tests fermés (Google Play, App Store, web) : trouver des testeurs, tester les applications des autres")
public class PlaytestController {

    private final PlaytestService playtests;
    private final RateLimiter rateLimiter;

    public PlaytestController(PlaytestService playtests, RateLimiter rateLimiter) {
        this.playtests = playtests;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/playtests")
    @Operation(summary = "Campagnes de test fermé (TST-1)", description = """
            Actives par défaut, les plus récentes d'abord ; status=COMPLETED pour les terminées. availability=OPEN : \
            avec une place libre ; FULL : complètes.""")
    @ApiResponse(responseCode = "200", description = "Page de campagnes")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE, INVALID_STATUS, INVALID_PARAMETER",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<PlaytestSummary> list(
            @Parameter(description = "ACTIVE (par défaut) ou COMPLETED") @RequestParam(required = false)
            CampaignStatus status,
            @RequestParam(required = false) Availability availability,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return playtests.list(status, availability, page, size);
    }

    @GetMapping("/playtests/mine")
    @Operation(summary = "Mes campagnes", description = "Tous statuts, brouillons compris, les plus récentes d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de campagnes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<PlaytestSummary> mine(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size,
                                              @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.mine(page, size, me);
    }

    @GetMapping("/playtests/{id}")
    @Operation(summary = "Page d'une campagne", description = """
            optInUrl et instructions ne sont donnés qu'au porteur, à l'équipe et aux testeurs inscrits : on rejoint \
            d'abord sur Zetsu, puis on suit le lien. Un brouillon, une campagne suspendue ou masquée n'existe que \
            pour le porteur, l'équipe et ses testeurs (404 pour les autres).""")
    @ApiResponse(responseCode = "200", description = "La campagne")
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail get(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.get(id, me);
    }

    @PostMapping("/playtests")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une campagne (TST-1)", description = "Toujours en brouillon : POST /playtests/{id}/submit pour la publier. Règles de chaque plateforme : voir le schéma PlaytestRequest.")
    @ApiResponse(responseCode = "201", description = "Brouillon créé")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail create(@Valid @RequestBody PlaytestRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return playtests.create(req, me);
    }

    @PutMapping("/playtests/{id}")
    @Operation(summary = "Modifier sa campagne", description = "En brouillon ou refusée seulement. Une campagne refusée redevient un brouillon, à renvoyer.")
    @ApiResponse(responseCode = "200", description = "Campagne modifiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_EDITABLE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail edit(@PathVariable Long id, @Valid @RequestBody PlaytestRequest req,
                               @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.edit(id, req, me);
    }

    @PutMapping(value = "/playtests/{id}/icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Icône de l'application", description = """
            Formulaire multipart, champ photo : PNG, JPG ou WebP de 2 Mo maximum, vérifié par son contenu. Recadrée \
            en 128 px. Impossible sur une campagne terminée.""")
    @ApiResponse(responseCode = "200", description = "Campagne à jour, iconUrl pointe vers la nouvelle icône")
    @ApiResponse(responseCode = "400", description = "PHOTO_REQUIRED, PHOTO_TYPE, PHOTO_TOO_LARGE, FILE_TOO_LARGE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_COMPLETED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "503", description = "STORAGE_UNAVAILABLE : Cloudinary injoignable, réessayer", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE, schema = @Schema(implementation = AvatarForm.class)))
    public PlaytestDetail icon(@PathVariable Long id,
                               @Parameter(hidden = true) @RequestPart(required = false) MultipartFile photo,
                               @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return playtests.updateIcon(id, photo, me);
    }

    @GetMapping("/playtests/{id}/icon/{file}")
    @Operation(summary = "Icône gardée sur le serveur", description = "Ne pas construire cette adresse : utiliser iconUrl. En cache un an.")
    @ApiResponse(responseCode = "200", description = "L'image", content = {
            @Content(mediaType = "image/png"), @Content(mediaType = "image/jpeg"), @Content(mediaType = "image/webp")})
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND, ICON_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Resource> iconFile(@PathVariable Long id, @PathVariable String file) {
        PlaytestService.Icon icon = playtests.icon(id, file);
        return ResponseEntity.ok()
                .contentType(icon.type())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(icon.file());
    }

    @PostMapping("/playtests/{id}/submit")
    @Operation(summary = "Publier sa campagne", description = """
            Un porteur de niveau Membre (50 points) ou plus est publié tout de suite (ACTIVE) ; sinon la campagne \
            attend l'équipe (PENDING_REVIEW). Une campagne WEB attend toujours l'équipe. Une seule campagne en cours \
            par application et par plateforme.""")
    @ApiResponse(responseCode = "200", description = "Campagne envoyée")
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_DRAFT, PACKAGE_ALREADY_RUNNING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail submit(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.submit(id, me);
    }

    @PostMapping("/playtests/{id}/close")
    @Operation(summary = "Clôturer sa campagne", description = "Plus de nouveaux testeurs ; ceux en cours vont au bout de leurs jours et gagnent leurs points. Campagne web (tracking NONE) : les testeurs installés depuis 24 heures terminent tout de suite et gagnent leurs points, les autres partent.")
    @ApiResponse(responseCode = "200", description = "Campagne terminée")
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_ACTIVE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail close(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.close(id, me);
    }

    @GetMapping("/playtests/{id}/participations")
    @Operation(summary = "Testeurs de sa campagne", description = """
            Pour le porteur : jours effectués, niveau de preuve, « à confirmer » (needsAttention), adresse Google \
            déclarée. Dans l'ordre d'arrivée.""")
    @ApiResponse(responseCode = "200", description = "Tous les testeurs, partis compris")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<ParticipationView> participations(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.participations(id, me);
    }

    @PostMapping("/playtests/{id}/participations")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Rejoindre une campagne (TST-2)", description = """
            Prend une place tout de suite et donne optInUrl. L'installation est à déclarer sous 48 heures, sinon la \
            place se libère. On ne rejoint qu'une fois une campagne, même après un départ.""")
    @ApiResponse(responseCode = "201", description = "Campagne avec myParticipation")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "CANNOT_JOIN_OWN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PLAYTEST_NOT_ACTIVE, ALREADY_JOINED, CAMPAIGN_FULL", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail join(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return playtests.join(id, me);
    }

    @PostMapping("/playtests/{id}/participations/me/confirm")
    @Operation(summary = "Déclarer l'installation", description = "Le décompte des jours commence maintenant (rien à décompter pour une campagne web). Adresse Google facultative.")
    @ApiResponse(responseCode = "200", description = "Campagne avec myParticipation")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PARTICIPATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PARTICIPATION_NOT_JOINED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail confirm(@PathVariable Long id, @Valid @RequestBody(required = false) ConfirmRequest req,
                                  @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.confirm(id, req == null ? null : req.googleEmail(), me);
    }

    @PostMapping("/playtests/{id}/participations/me/check-in")
    @Operation(summary = "« Toujours inscrit »", description = "Une fois par jour (UTC). Sert à repérer les décrochages, pas de preuve.")
    @ApiResponse(responseCode = "200", description = "Campagne avec myParticipation")
    @ApiResponse(responseCode = "404", description = "PARTICIPATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PARTICIPATION_NOT_RUNNING, ALREADY_CHECKED_IN, CHECK_IN_NOT_TRACKED (campagne web)", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail checkIn(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.checkIn(id, me);
    }

    @PostMapping("/playtests/{id}/participations/me/withdraw")
    @Operation(summary = "Se désister", description = "La place se libère pour un autre testeur. Motif facultatif.")
    @ApiResponse(responseCode = "200", description = "Campagne avec myParticipation")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PARTICIPATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PARTICIPATION_NOT_RUNNING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PlaytestDetail withdraw(@PathVariable Long id, @Valid @RequestBody(required = false) WithdrawRequest req,
                                   @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.withdraw(id, req == null ? null : req.reason(), me);
    }

    @PostMapping("/playtests/{id}/participations/{participationId}/verify")
    @Operation(summary = "Testeur vérifié dans la Play Console", description = "Par le porteur, sur une installation déclarée.")
    @ApiResponse(responseCode = "200", description = "Testeurs à jour")
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND, PARTICIPATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PARTICIPATION_NOT_CONFIRMED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<ParticipationView> verify(@PathVariable Long id, @PathVariable Long participationId,
                                          @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.verify(id, participationId, me);
    }

    @PostMapping("/playtests/{id}/participations/{participationId}/remove")
    @Operation(summary = "Retirer un testeur", description = "Par le porteur, avec un motif montré au testeur. La place se libère.")
    @ApiResponse(responseCode = "200", description = "Testeurs à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_PLAYTEST_OWNER", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PLAYTEST_NOT_FOUND, PARTICIPATION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "PARTICIPATION_NOT_RUNNING", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<ParticipationView> remove(@PathVariable Long id, @PathVariable Long participationId,
                                          @Valid @RequestBody RemoveRequest req,
                                          @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.removeByOwner(id, participationId, req.reason(), me);
    }

    @GetMapping("/users/me/playtest-participations")
    @Operation(summary = "Mes participations à des tests fermés", description = "Les plus récentes d'abord, avec leurs compteurs.")
    @ApiResponse(responseCode = "200", description = "Page de participations")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<MyPlaytestEntry> myParticipations(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size,
                                                          @AuthenticationPrincipal ZetsuPrincipal me) {
        return playtests.myParticipations(page, size, me);
    }
}
