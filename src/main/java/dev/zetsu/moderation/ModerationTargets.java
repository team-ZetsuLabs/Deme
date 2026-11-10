package dev.zetsu.moderation;

import org.jsoup.Jsoup;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Accès aux contenus signalables sans dépendre de leurs domaines : auteur, titre et extrait pour la file, et
 * le drapeau {@code hidden} que les domaines lisent pour masquer (MOD-2, MOD-3).
 */
@Component
public class ModerationTargets {

    private static final int TITLE_LENGTH = 150;
    private static final int EXCERPT_LENGTH = 300;

    /**
     * @param title      titre de la question, de l'offre ou de la mission ; début de la réponse ; pseudo du profil
     * @param questionId question parente quand la cible est une réponse
     */
    public record Target(Long authorId, String title, String excerpt, Long questionId, boolean hidden) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public ModerationTargets(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Target> find(ReportTargetType type, Long id) {
        String sql = switch (type) {
            case QUESTION -> "select author_id, title, body_html as html, null as question_id, hidden"
                    + " from questions where id = :id";
            case ANSWER -> "select author_id, null as title, body_html as html, question_id, hidden"
                    + " from answers where id = :id";
            case JOB -> "select recruiter_id as author_id, title, description_html as html, null as question_id, hidden"
                    + " from jobs where id = :id";
            case MISSION -> "select author_id, title, description_html as html, null as question_id, hidden"
                    + " from missions where id = :id";
            case USER -> "select id as author_id, username as title, bio as html, null as question_id, hidden"
                    + " from users where id = :id and status <> 'DELETED'";
            case PROJECT -> "select owner_id as author_id, title, description_html as html, null as question_id, hidden"
                    + " from projects where id = :id";
            case PLAYTEST -> "select owner_id as author_id, app_name as title, description_html as html,"
                    + " null as question_id, hidden from test_campaigns where id = :id";
        };
        List<Target> rows = jdbc.query(sql, new MapSqlParameterSource("id", id), (rs, i) -> {
            String text = rs.getString("html") == null ? "" : Jsoup.parse(rs.getString("html")).text();
            String title = rs.getString("title") != null ? rs.getString("title") : cut(text, TITLE_LENGTH);
            long questionId = rs.getLong("question_id");
            return new Target(rs.getLong("author_id"), title, text.isEmpty() ? null : cut(text, EXCERPT_LENGTH),
                    rs.wasNull() ? null : questionId, rs.getBoolean("hidden"));
        });
        return rows.stream().findFirst();
    }

    public void setHidden(ReportTargetType type, Long id, boolean hidden) {
        String table = switch (type) {
            case QUESTION -> "questions";
            case ANSWER -> "answers";
            case JOB -> "jobs";
            case MISSION -> "missions";
            case USER -> "users";
            case PROJECT -> "projects";
            case PLAYTEST -> "test_campaigns";
        };
        // Une question supprimée par son auteur (QA-3) reste masquée, quelle que soit la décision.
        String notDeleted = type == ReportTargetType.QUESTION ? " and deleted_at is null" : "";
        jdbc.update("update " + table + " set hidden = :hidden where id = :id" + notDeleted,
                new MapSqlParameterSource("id", id).addValue("hidden", hidden));
    }

    private static String cut(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1).trim() + "…";
    }
}
