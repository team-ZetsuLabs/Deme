package dev.zetsu.tag;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@Tag(name = "tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(summary = "Étiquettes les plus utilisées, filtrables par début de nom (autocomplétion)")
    public List<TagDtos.TagCount> list(@RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "20") int limit) {
        return tagService.popular(q, limit);
    }
}
