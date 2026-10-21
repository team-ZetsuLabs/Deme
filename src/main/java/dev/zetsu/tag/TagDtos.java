package dev.zetsu.tag;

import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class TagDtos {

    private TagDtos() {
    }

    @Schema(name = "TagCount")
    public record TagCount(
            @Schema(requiredMode = REQUIRED, example = "mobile-money") String name,
            @Schema(requiredMode = REQUIRED, example = "42") long questionCount) {
    }
}
