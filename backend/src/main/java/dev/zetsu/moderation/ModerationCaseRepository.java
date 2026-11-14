package dev.zetsu.moderation;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ModerationCaseRepository extends JpaRepository<ModerationCase, Long> {

    /** Crée le dossier s'il n'existe pas encore, sans erreur si deux signalements arrivent en même temps. */
    @Modifying
    @Query(value = """
            insert into moderation_cases (target_type, target_id, target_author_id)
            values (:targetType, :targetId, :authorId)
            on conflict (target_type, target_id) do nothing""", nativeQuery = true)
    void createIfAbsent(@Param("targetType") String targetType, @Param("targetId") Long targetId,
                        @Param("authorId") Long authorId);

    /** Verrouillé : le compteur et le masquage automatique restent justes sous signalements simultanés. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ModerationCase c where c.targetType = :targetType and c.targetId = :targetId")
    Optional<ModerationCase> lockByTarget(@Param("targetType") ReportTargetType targetType,
                                          @Param("targetId") Long targetId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ModerationCase c where c.id = :id")
    Optional<ModerationCase> lockById(@Param("id") Long id);

    /** File des Référents (MOD-3) : dossiers sans décision, jamais ceux du membre qui regarde. */
    @Query("""
            select c from ModerationCase c
            where c.decidedAt is null and c.status in (:statuses) and c.targetAuthorId <> :viewerId
              and (:targetType is null or c.targetType = :targetType)
            order by c.reportCount desc, c.firstReportedAt asc, c.id asc""")
    Page<ModerationCase> findQueue(@Param("statuses") Collection<CaseStatus> statuses,
                                   @Param("targetType") ReportTargetType targetType,
                                   @Param("viewerId") Long viewerId, Pageable pageable);

    /**
     * Back office (MOD-4). Sans statut : les contestations d'abord, puis les dossiers sans décision, les plus
     * signalés d'abord.
     */
    @Query("""
            select c from ModerationCase c
            where (:status is null and (c.status = :appealed or (c.decidedAt is null and c.status in (:queue)))
                   or c.status = :status)
              and (:targetType is null or c.targetType = :targetType)
            order by case when c.status = :appealed then 0 else 1 end, c.reportCount desc, c.firstReportedAt asc,
                     c.id asc""")
    Page<ModerationCase> findForTeam(@Param("status") CaseStatus status,
                                     @Param("targetType") ReportTargetType targetType,
                                     @Param("appealed") CaseStatus appealed,
                                     @Param("queue") Collection<CaseStatus> queue, Pageable pageable);

    Page<ModerationCase> findByTargetAuthorIdAndStatusInOrderByUpdatedAtDescIdDesc(
            Long authorId, Collection<CaseStatus> statuses, Pageable pageable);

    interface ReasonCountRow {
        Long getCaseId();

        ReportReason getReason();

        long getCount();
    }

    @Query("""
            select r.caseId as caseId, r.reason as reason, count(r) as count from Report r
            where r.caseId in :caseIds group by r.caseId, r.reason""")
    List<ReasonCountRow> reasonCounts(@Param("caseIds") Collection<Long> caseIds);

    interface CommentRow {
        Long getCaseId();

        String getComment();
    }

    @Query("""
            select r.caseId as caseId, r.comment as comment from Report r
            where r.caseId in :caseIds and r.comment is not null
            order by r.createdAt desc, r.id desc""")
    List<CommentRow> comments(@Param("caseIds") Collection<Long> caseIds);
}
