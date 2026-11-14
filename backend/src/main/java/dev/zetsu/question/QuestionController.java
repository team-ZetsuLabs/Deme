package dev.zetsu.question;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.CountryCode;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.question.QuestionDtos.QuestionDetail;
import dev.zetsu.question.QuestionDtos.QuestionImageForm;
import dev.zetsu.question.QuestionDtos.QuestionImageView;
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
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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

@RestController
@RequestMapping("/api/v1/questions")
@Tag(name = "questions", description = "Entraide : questions avec contexte africain")
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionImageService imageService;
    private final RateLimiter rateLimiter;

    public QuestionController(QuestionService questionService, QuestionImageService imageService,
                              RateLimiter rateLimiter) {
        this.questionService = questionService;
        this.imageService = imageService;
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

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Envoyer une image pour une question (QA-11)", description = """
            Formulaire multipart, champ image : PNG, JPG ou WebP de 2 Mo maximum, vérifié par son contenu. Renvoie             { id, url } : citer id dans imageIds de POST ou PUT /questions (2 images au plus). Une image jamais             rattachée à une question est effacée au bout d'un jour.""")
    @ApiResponse(responseCode = "201", description = "Image enregistrée")
    @ApiResponse(responseCode = "400", description = "PHOTO_REQUIRED, PHOTO_TYPE, PHOTO_TOO_LARGE, FILE_TOO_LARGE (plus de 5 Mo)", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "503", description = "STORAGE_UNAVAILABLE : Cloudinary injoignable, réessayer", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE, schema = @Schema(implementation = QuestionImageForm.class)))
    public QuestionImageView uploadImage(@Parameter(hidden = true) @RequestPart(required = false) MultipartFile image,
                                         @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return imageService.upload(image, me.id());
    }

    @GetMapping("/images/{file}")
    @Operation(summary = "Image gardée sur le serveur", description = "Ne pas construire cette adresse : utiliser url. En cache un an.")
    @ApiResponse(responseCode = "200", description = "L'image", content = {
            @Content(mediaType = "image/png"), @Content(mediaType = "image/jpeg"), @Content(mediaType = "image/webp")})
    @ApiResponse(responseCode = "404", description = "IMAGE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Resource> imageFile(@PathVariable String file) {
        QuestionImageService.Image image = imageService.load(file);
        return ResponseEntity.ok()
                .contentType(image.type())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(image.file());
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer sa question (QA-3)", description = """
            Seulement tant qu'elle n'a aucune réponse (canDelete sur la question). Les points qu'elle a rapportés             (question posée, votes reçus) sont retirés ; elle disparaît des listes, de la recherche et des             notifications.""")
    @ApiResponse(responseCode = "204", description = "Question supprimée")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_QUESTION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "QUESTION_HAS_ANSWERS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void delete(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        questionService.delete(id, me);
    }
}
