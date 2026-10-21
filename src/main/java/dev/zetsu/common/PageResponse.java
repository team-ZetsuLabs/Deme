package dev.zetsu.common;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Réponse paginée : {@code { "items": [...], "page": 0, "size": 20, "total": 134 }}. */
public record PageResponse<T>(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<T> items,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "0") int page,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "20") int size,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "134") long total) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements());
    }
}
