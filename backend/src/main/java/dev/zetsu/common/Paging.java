package dev.zetsu.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

/** Valide {@code ?page=0&size=20} : taille entre 1 et 50, page positive. */
public final class Paging {

    public static final int MAX_SIZE = 50;

    private Paging() {
    }

    public static PageRequest of(int page, int size, Sort sort) {
        if (page < 0) {
            throw ApiException.badRequest("INVALID_PAGE", "La page doit être positive");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw ApiException.badRequest("INVALID_PAGE_SIZE", "La taille doit être comprise entre 1 et " + MAX_SIZE);
        }
        return PageRequest.of(page, size, sort);
    }

    public static PageRequest of(int page, int size) {
        return of(page, size, Sort.unsorted());
    }
}
