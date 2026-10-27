package dev.zetsu.question;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.CountryCode;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.question.QuestionDtos.QuestionDetail;
import dev.zetsu.question.QuestionDtos.QuestionRequest;
import dev.zetsu.question.QuestionDtos.QuestionSummary;
import dev.zetsu.question.QuestionDtos.SimilarQuestion;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/questions")
@Tag(name = "questions", description = "Entraide : questions avec contexte africain")
public class QuestionController {

    private final QuestionService questionService;
    private final RateLimiter rateLimiter;

    public QuestionController(QuestionService questionService, RateLimiter rateLimiter) {
        this.questionService = questionService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping
    @Operation(summary = "Liste et recherche des questions",
            description = "Recherche plein texte en français et en anglais sur titre, détails et étiquettes avec q "
                    + "(syntaxe web : \"phrase exacte\", -exclu, OR). Pagination par 20.")
    @ApiResponse(responseCode = "200", description = "Page de questions")
    @ApiResponse(responseCode = "400", description = "INVALID_PAGE, INVALID_PAGE_SIZE, INVALID_PARAMETER, INVALID_COUNTRY",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<QuestionSummary> list(
            @Parameter(description = "Texte recherché") @RequestParam(required = false) String q,
            @Parameter(description = "Nom d'étiquette exact") @RequestParam(required = false) String tag,
            @Parameter(description = "Code pays ISO, ex. SN") @RequestParam(required = false) String country,
            @RequestParam(required = false) MobileMoneyOperator operator,
            @RequestParam(required = false) NetworkQuality network,
            @Parameter(description = "Pseudo de l'auteur") @RequestParam(required = false) String author,
            @Parameter(description = "Adresse d'une communauté (COM-1) : questions de son pays ou de son étiquette")
            @RequestParam(required = false) String community,
            @Parameter(description = "Toutes, sans solution, résolues")
            @RequestParam(defaultValue = "ALL") QuestionSearch.Status status,
            @RequestParam(defaultValue = "RELEVANCE") QuestionSearch.Sort sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (country != null && !CountryCode.ISO_CODES.contains(country)) {
            throw ApiException.badRequest("INVALID_COUNTRY", "Code pays inconnu");
        }
        String text = q == null ? null : q.length() > 200 ? q.substring(0, 200) : q;
        var criteria = new QuestionSearch.Criteria(text, tag == null ? null : TagService.normalize(tag),
                country, operator, network, author, community, status, sort);
        return questionService.list(criteria, page, size);
    }

    @GetMapping("/similar")
    @Operation(summary = "Questions similaires (QA-8)",
            description = "À appeler pendant la saisie du titre, après une courte pause. Plein texte en français et en "
                    + "anglais ; un titre de moins de 10 caractères renvoie une liste vide. exclude écarte la question "
                    + "en cours de modification.")
    @ApiResponse(responseCode = "200", description = "Jusqu'à limit questions, les plus proches d'abord")
    @ApiResponse(responseCode = "400", description = "INVALID_LIMIT, INVALID_PARAMETER",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<SimilarQuestion> similar(
            @Parameter(description = "Titre en cours de saisie") @RequestParam String title,
            @Parameter(description = "Identifiant de la question modifiée") @RequestParam(required = false) Long exclude,
            @Parameter(description = "De 1 à 10") @RequestParam(defaultValue = "5") int limit) {
        return questionService.similar(title, exclude, limit);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une question")
    @ApiResponse(responseCode = "200", description = "La question")
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public QuestionDetail get(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        return questionService.get(id, me);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Poser une question")
    @ApiResponse(responseCode = "201", description = "Question publiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, TAG_REQUIRED, TOO_MANY_TAGS",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public QuestionDetail create(@Valid @RequestBody QuestionRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return questionService.create(req, me);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier sa question")
    @ApiResponse(responseCode = "200", description = "Question modifiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_QUESTION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public QuestionDetail update(@PathVariable Long id, @Valid @RequestBody QuestionRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        return questionService.update(id, req, me);
    }
}
