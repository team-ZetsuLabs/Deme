package dev.zetsu.tag;

import dev.zetsu.common.ApiException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class TagService {

    public static final int MAX_TAGS = 5;
    private static final Pattern NAME = Pattern.compile("^[a-z0-9][a-z0-9.+#-]{0,29}$");

    private final TagRepository tags;

    public TagService(TagRepository tags) {
        this.tags = tags;
    }

    /** Normalise les étiquettes saisies et crée celles qui n'existent pas encore. L'ordre est conservé. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Set<Tag> resolve(List<String> rawNames) {
        Set<String> names = new LinkedHashSet<>();
        for (String raw : rawNames == null ? List.<String>of() : rawNames) {
            String name = normalize(raw);
            if (!name.isEmpty()) {
                if (!NAME.matcher(name).matches()) {
                    throw ApiException.badRequest("INVALID_TAG", "Étiquette invalide : " + name);
                }
                names.add(name);
            }
        }
        if (names.isEmpty()) {
            throw ApiException.badRequest("TAG_REQUIRED", "Au moins une étiquette est obligatoire");
        }
        if (names.size() > MAX_TAGS) {
            throw ApiException.badRequest("TOO_MANY_TAGS", MAX_TAGS + " étiquettes maximum");
        }
        Map<String, Tag> existing = tags.findByNameIn(names).stream()
                .collect(Collectors.toMap(Tag::getName, Function.identity()));
        Set<Tag> result = new LinkedHashSet<>();
        for (String name : names) {
            result.add(existing.computeIfAbsent(name, this::create));
        }
        return result;
    }

    private Tag create(String name) {
        try {
            return tags.saveAndFlush(new Tag(name));
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflict("TAG_CONFLICT", "Réessayez, l'étiquette vient d'être créée");
        }
    }

    @Transactional(readOnly = true)
    public List<TagDtos.TagCount> popular(String prefix, int limit) {
        String p = prefix == null ? "" : normalize(prefix).replaceAll("[%_\\\\]", "");
        return tags.popular(p, Math.min(Math.max(limit, 1), 50)).stream()
                .map(t -> new TagDtos.TagCount(t.getName(), t.getQuestionCount()))
                .toList();
    }

    public static String normalize(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase().replaceAll("\\s+", "-");
    }
}
