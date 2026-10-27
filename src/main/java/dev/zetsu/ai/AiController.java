package dev.zetsu.ai;

import dev.zetsu.ai.AiDtos.QuestionAssistRequest;
import dev.zetsu.ai.AiDtos.QuestionAssistResponse;
import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "ai", description = "Assistant IA : propose, ne décide jamais")
public class AiController {

    private final QuestionAssistService assistService;
    private final RateLimiter rateLimiter;

    public AiController(QuestionAssistService assistService, RateLimiter rateLimiter) {
        this.assistService = assistService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/question-assist")
    @Operation(summary = "Améliorer un brouillon de question (IA-1)", description = """
            Propose un titre plus clair, des étiquettes, le contexte africain détecté et les informations manquantes. \
            Rien n'est enregistré ni modifié. 10 appels par membre et par heure ; un même brouillon est servi depuis \
            un cache de 24 heures. Le front abandonne au bout de 8 secondes : sur toute erreur, il masque le bouton \
            et le formulaire continue de marcher.""")
    @ApiResponse(responseCode = "200", description = "Suggestions")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "503", description = "AI_UNAVAILABLE : fournisseur coupé, trop lent ou non configuré",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public QuestionAssistResponse questionAssist(@Valid @RequestBody QuestionAssistRequest req,
                                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.AI, "user:" + me.id());
        return assistService.assist(req);
    }
}
