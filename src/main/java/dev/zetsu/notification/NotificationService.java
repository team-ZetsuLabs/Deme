package dev.zetsu.notification;

import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationDtos.NotificationTarget;
import dev.zetsu.notification.NotificationDtos.UnreadCount;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Types;
import java.util.Collection;
import java.util.List;

/**
 * NOT-1. Les autres domaines appellent {@code notify} dans leur propre transaction : une notification n'existe que
 * si l'action a vraiment eu lieu. Ce domaine ne dépend d'aucun autre.
 */
@Service
public class NotificationService {

    private static final int TITLE_MAX = 150;

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final ReputationService reputation;
    private final NamedParameterJdbcTemplate jdbc;

    public NotificationService(NotificationRepository notifications, UserRepository users,
                               ReputationService reputation, NamedParameterJdbcTemplate jdbc) {
        this.notifications = notifications;
        this.users = users;
        this.reputation = reputation;
        this.jdbc = jdbc;
    }

    public static NotificationTarget target(NotificationTargetType type, Long id, String title) {
        return new NotificationTarget(type, id, title, null);
    }

    public static NotificationTarget answer(Long answerId, String questionTitle, Long questionId) {
        return new NotificationTarget(NotificationTargetType.ANSWER, answerId, questionTitle, questionId);
    }

    /** Rien n'est envoyé à celui qui agit lui-même. {@code actorId} null : événement de la plateforme. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void notify(Long recipientId, NotificationType type, Long actorId, NotificationTarget target, String outcome) {
        if (recipientId == null || recipientId.equals(actorId)) {
            return;
        }
        User actor = actorId == null ? null : users.getReferenceById(actorId);
        notifications.save(new Notification(recipientId, type, actor, target.type(), target.id(), title(target),
                target.questionId(), outcome));
    }

    /** Une seule fois par acteur et par cible : un vote retiré puis remis ne renotifie pas. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void notifyOnce(Long recipientId, NotificationType type, Long actorId, NotificationTarget target) {
        if (recipientId == null || recipientId.equals(actorId) || notifications
                .existsByRecipientIdAndTypeAndActorIdAndTargetTypeAndTargetId(recipientId, type, actorId,
                        target.type(), target.id())) {
            return;
        }
        notify(recipientId, type, actorId, target, null);
    }

    /**
     * JOB_MATCH, MISSION_MATCH : tous les membres actifs dont la stack contient au moins une des technologies,
     * sauf l'auteur, en une seule requête.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void notifyStackMatch(NotificationType type, Long actorId, Long excludedUserId, Collection<Long> tagIds,
                                 NotificationTarget target) {
        if (tagIds.isEmpty()) {
            return;
        }
        jdbc.update("""
                insert into notifications (recipient_id, type, actor_id, target_type, target_id, target_title)
                select distinct ut.user_id, :type, :actor, :targetType, :targetId, :title
                from user_technologies ut join users u on u.id = ut.user_id
                where ut.tag_id in (:tags) and ut.user_id <> :excluded and u.status = 'ACTIVE'
                """, new MapSqlParameterSource()
                .addValue("type", type.name())
                .addValue("actor", actorId, Types.BIGINT)
                .addValue("targetType", target.type().name())
                .addValue("targetId", target.id())
                .addValue("title", title(target))
                .addValue("tags", tagIds)
                .addValue("excluded", excludedUserId));
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDtos.Notification> list(Long recipientId, boolean unreadOnly, int page, int size) {
        return PageResponse.of(notifications.findFor(recipientId, unreadOnly, Paging.of(page, size)), this::toDto);
    }

    @Transactional(readOnly = true)
    public UnreadCount unreadCount(Long recipientId) {
        return new UnreadCount(notifications.countUnread(recipientId));
    }

    @Transactional
    public UnreadCount markRead(Long recipientId, List<Long> ids) {
        if (ids == null) {
            notifications.markAllRead(recipientId);
        } else if (!ids.isEmpty()) {
            notifications.markRead(recipientId, ids);
        }
        return unreadCount(recipientId);
    }

    /** AUTH-6 : les notifications reçues partent avec le compte ; celles envoyées gardent « Utilisateur supprimé ». */
    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        notifications.deleteAllOf(event.userId());
    }

    private NotificationDtos.Notification toDto(Notification n) {
        User actor = n.getActor();
        AuthorSummary actorSummary = actor == null ? null
                : AuthorSummary.from(actor, reputation.levelOf(actor.getReputation()));
        return new NotificationDtos.Notification(n.getId(), n.getType(), n.isRead(), actorSummary,
                new NotificationTarget(n.getTargetType(), n.getTargetId(), n.getTargetTitle(), n.getQuestionId()),
                n.getOutcome(), n.getCreatedAt());
    }

    private static String title(NotificationTarget target) {
        String t = target.title() == null ? "" : target.title();
        return t.length() > TITLE_MAX ? t.substring(0, TITLE_MAX) : t;
    }
}
