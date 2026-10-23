package dev.zetsu.tag;

import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.tag.TagDtos.AdminTag;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Back office des étiquettes (MOD-4). Une étiquette sert aux questions, aux offres, aux missions et aux stacks des
 * membres : la fusion déplace tous ces usages sans créer de doublon.
 */
@Service
public class TagAdminService {

    private static final Pattern NAME = Pattern.compile("^[a-z0-9][a-z0-9.+#-]{0,29}$");

    /** Tables de liaison et leur colonne propriétaire. Noms fixes : jamais issus d'une saisie. */
    private static final List<String[]> USAGES = List.of(
            new String[]{"question_tags", "question_id"},
            new String[]{"job_technologies", "job_id"},
            new String[]{"mission_technologies", "mission_id"},
            new String[]{"user_technologies", "user_id"});

    private static final String WITH_COUNTS = """
            select t.id, t.name,
                   (select count(*) from question_tags x where x.tag_id = t.id) as question_count,
                   (select count(*) from job_technologies x where x.tag_id = t.id) as job_count,
                   (select count(*) from mission_technologies x where x.tag_id = t.id) as mission_count,
                   (select count(*) from user_technologies x where x.tag_id = t.id) as member_count
            from tags t""";

    private static final RowMapper<AdminTag> ROW = (rs, i) -> new AdminTag(rs.getString("name"),
            rs.getLong("question_count"), rs.getLong("job_count"), rs.getLong("mission_count"),
            rs.getLong("member_count"));

    private final NamedParameterJdbcTemplate jdbc;

    public TagAdminService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminTag> list(String prefix, boolean unused, int page, int size) {
        Paging.of(page, size);
        String p = prefix == null ? "" : TagService.normalize(prefix).replaceAll("[%_\\\\]", "");
        String sql = "select * from (" + WITH_COUNTS + " where t.name like :prefix) s"
                + (unused ? " where question_count + job_count + mission_count + member_count = 0" : "");
        MapSqlParameterSource params = new MapSqlParameterSource("prefix", p + "%");
        Long total = jdbc.queryForObject("select count(*) from (" + sql + ") c", params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<AdminTag> items = jdbc.query(sql + " order by name limit :limit offset :offset", params, ROW);
        return new PageResponse<>(items, page, size, total == null ? 0 : total);
    }

    @Transactional
    public AdminTag create(String rawName) {
        String name = TagService.normalize(rawName);
        if (!NAME.matcher(name).matches()) {
            throw ApiException.badRequest("INVALID_TAG", "Étiquette invalide : " + name);
        }
        try {
            jdbc.update("insert into tags (name) values (:name)", new MapSqlParameterSource("name", name));
        } catch (DuplicateKeyException e) {
            throw ApiException.conflict("TAG_EXISTS", "Cette étiquette existe déjà");
        }
        return load(name);
    }

    @Transactional
    public AdminTag merge(String fromName, String intoName) {
        long from = idOf(TagService.normalize(fromName));
        long into = idOf(TagService.normalize(intoName));
        if (from == into) {
            throw ApiException.badRequest("SAME_TAG", "Choisissez une autre étiquette cible");
        }
        MapSqlParameterSource params = new MapSqlParameterSource("from", from).addValue("into", into);
        for (String[] usage : USAGES) {
            String table = usage[0];
            String owner = usage[1];
            // Ceux qui ont déjà la cible perdent seulement l'étiquette fusionnée ; les autres passent sur la cible.
            jdbc.update("update " + table + " set tag_id = :into where tag_id = :from and " + owner
                    + " not in (select " + owner + " from " + table + " where tag_id = :into)", params);
            jdbc.update("delete from " + table + " where tag_id = :from", params);
        }
        // tags_text alimente la recherche plein texte (QA-7) : on le recalcule pour les questions concernées.
        jdbc.update("""
                update questions q set tags_text = (
                    select coalesce(string_agg(t.name, ' ' order by t.name), '')
                    from question_tags qt join tags t on t.id = qt.tag_id where qt.question_id = q.id)
                where q.id in (select question_id from question_tags where tag_id = :into)""", params);
        jdbc.update("delete from tags where id = :from", params);
        return load(TagService.normalize(intoName));
    }

    @Transactional
    public void delete(String rawName) {
        AdminTag tag = load(TagService.normalize(rawName));
        if (tag.questionCount() + tag.jobCount() + tag.missionCount() + tag.memberCount() > 0) {
            throw ApiException.conflict("TAG_IN_USE", "Cette étiquette est encore utilisée");
        }
        jdbc.update("delete from tags where name = :name", new MapSqlParameterSource("name", tag.name()));
    }

    private AdminTag load(String name) {
        return jdbc.query(WITH_COUNTS + " where t.name = :name", new MapSqlParameterSource("name", name), ROW)
                .stream().findFirst().orElseThrow(TagAdminService::notFound);
    }

    private long idOf(String name) {
        return jdbc.queryForList("select id from tags where name = :name", new MapSqlParameterSource("name", name),
                Long.class).stream().findFirst().orElseThrow(TagAdminService::notFound);
    }

    private static ApiException notFound() {
        return ApiException.notFound("TAG_NOT_FOUND", "Étiquette introuvable");
    }
}
