package dev.zetsu.tag;

import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.tag.TagDtos.AdminTag;
import dev.zetsu.tag.TagDtos.TagMergeRequest;
import dev.zetsu.tag.TagDtos.TagRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Back office (MOD-4) : créer, fusionner, supprimer une étiquette inutilisée. Les étiquettes sont désignées par leur nom. */
@RestController
@RequestMapping("/api/v1/admin/tags")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class TagAdminController {

    private final TagAdminService tagAdminService;

    public TagAdminController(TagAdminService tagAdminService) {
        this.tagAdminService = tagAdminService;
    }

    @GetMapping
    @Operation(summary = "Étiquettes et leurs usages",
            description = "q filtre par début de nom. unused=true ne garde que les étiquettes que plus rien n'utilise. "
                    + "Par ordre alphabétique.")
    @ApiResponse(responseCode = "200", description = "Page d'étiquettes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AdminTag> list(@RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "false") boolean unused,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "50") int size) {
        return tagAdminService.list(q, unused, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une étiquette", description = "Le nom est mis en minuscules.")
    @ApiResponse(responseCode = "201", description = "Étiquette créée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "TAG_EXISTS", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminTag create(@Valid @RequestBody TagRequest req) {
        return tagAdminService.create(req.name());
    }

    @PostMapping("/{name}/merge")
    @Operation(summary = "Fusionner une étiquette dans une autre",
            description = "Questions, offres, missions et stacks passent sur l'étiquette cible, sans doublon ; "
                    + "l'étiquette fusionnée disparaît. Renvoie l'étiquette cible.")
    @ApiResponse(responseCode = "200", description = "Étiquette cible, usages à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, SAME_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "TAG_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminTag merge(@PathVariable String name, @Valid @RequestBody TagMergeRequest req) {
        return tagAdminService.merge(name, req.into());
    }

    @DeleteMapping("/{name}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer une étiquette inutilisée")
    @ApiResponse(responseCode = "204", description = "Étiquette supprimée")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "TAG_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "TAG_IN_USE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void delete(@PathVariable String name) {
        tagAdminService.delete(name);
    }
}
