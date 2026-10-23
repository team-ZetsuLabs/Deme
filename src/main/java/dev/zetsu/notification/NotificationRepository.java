package dev.zetsu.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = {"actor"})
    @Query("""
            select n from Notification n where n.recipientId = :recipientId and (:unreadOnly = false or n.read = false)
            order by n.createdAt desc, n.id desc""")
    Page<Notification> findFor(@Param("recipientId") Long recipientId, @Param("unreadOnly") boolean unreadOnly,
                               Pageable pageable);

    @Query("select count(n) from Notification n where n.recipientId = :recipientId and n.read = false")
    long countUnread(@Param("recipientId") Long recipientId);

    boolean existsByRecipientIdAndTypeAndActorIdAndTargetTypeAndTargetId(
            Long recipientId, NotificationType type, Long actorId, NotificationTargetType targetType, Long targetId);

    @Modifying
    @Query(value = "update notifications set read = true where recipient_id = :recipientId and not read",
            nativeQuery = true)
    void markAllRead(@Param("recipientId") Long recipientId);

    /** Seulement les notifications du membre : un identifiant d'un autre est ignoré sans erreur. */
    @Modifying
    @Query(value = "update notifications set read = true where recipient_id = :recipientId and id in (:ids)",
            nativeQuery = true)
    void markRead(@Param("recipientId") Long recipientId, @Param("ids") Collection<Long> ids);

    @Modifying
    @Query(value = "delete from notifications where recipient_id = :recipientId", nativeQuery = true)
    void deleteAllOf(@Param("recipientId") Long recipientId);
}
