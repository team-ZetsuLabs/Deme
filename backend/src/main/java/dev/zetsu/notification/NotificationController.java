package dev.zetsu.notification;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.notification.NotificationDtos.MarkReadRequest;
import dev.zetsu.notification.NotificationDtos.Notification;
import dev.zetsu.notification.NotificationDtos.UnreadCount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** NOT-1 : notifications dans l'application, sans temps réel (le front interroge le compteur). */
@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "notifications", description = "Notifications dans l'application")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Mes notifications", description = "Plus récentes d'abord. Lire la liste ne les marque pas comme lues.")
    @ApiResponse(responseCode = "200", description = "Page de notifications")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<Notification> list(@RequestParam(defaultValue = "false") boolean unreadOnly,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size,
                                           @AuthenticationPrincipal ZetsuPrincipal me) {
        return notificationService.list(me.id(), unreadOnly, page, size);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Nombre de non-lues", description = "Réponse minuscule, à interroger toutes les 60 s au plus (réseau 3G).")
    @ApiResponse(responseCode = "200", description = "Le compteur")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UnreadCount unreadCount(@AuthenticationPrincipal ZetsuPrincipal me) {
        return notificationService.unreadCount(me.id());
    }

    @PostMapping("/read")
    @Operation(summary = "Marquer comme lues", description = "Sans ids : « Tout marquer comme lu ». Renvoie le compteur à jour.")
    @ApiResponse(responseCode = "200", description = "Compteur de non-lues après l'opération")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public UnreadCount markRead(@Valid @RequestBody(required = false) MarkReadRequest req,
                                @AuthenticationPrincipal ZetsuPrincipal me) {
        return notificationService.markRead(me.id(), req == null ? null : req.ids());
    }
}
