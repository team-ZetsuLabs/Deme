package dev.zetsu.reputation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ReputationEventRepository extends JpaRepository<ReputationEvent, Long> {

    Page<ReputationEvent> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);

    /** AUTH-6 : la réputation d'un compte supprimé est effacée. */
    @Modifying
    @Query(value = "delete from reputation_events where user_id = :userId", nativeQuery = true)
    void deleteByUserId(@Param("userId") Long userId);

    /** Solde des points accordés pour une même cause : c'est ce qu'une annulation doit retirer. */
    @Query(value = """
            select coalesce(sum(delta), 0) from reputation_events
            where user_id = :userId and reason = :reason
              and question_id is not distinct from cast(:questionId as bigint)
              and answer_id is not distinct from cast(:answerId as bigint)
              and source_user_id is not distinct from cast(:sourceUserId as bigint)
            """, nativeQuery = true)
    int net(@Param("userId") Long userId, @Param("reason") String reason, @Param("questionId") Long questionId,
            @Param("answerId") Long answerId, @Param("sourceUserId") Long sourceUserId);

    /** Causes encore créditées sur une question elle-même (hors réponses) : user_id, reason, source_user_id. */
    @Query(value = """
            select user_id, reason, source_user_id from reputation_events
            where question_id = :questionId and answer_id is null
            group by user_id, reason, source_user_id having sum(delta) <> 0
            """, nativeQuery = true)
    List<Object[]> openCausesOnQuestion(@Param("questionId") Long questionId);

    @Query(value = """
            select coalesce(sum(delta), 0) from reputation_events
            where user_id = :userId and reason = :reason and submission_id = :submissionId
            """, nativeQuery = true)
    int netForSubmission(@Param("userId") Long userId, @Param("reason") String reason,
                         @Param("submissionId") Long submissionId);

    @Query(value = """
            select coalesce(sum(delta), 0) from reputation_events
            where user_id = :userId and reason = :reason and project_id = :projectId
            """, nativeQuery = true)
    int netForProject(@Param("userId") Long userId, @Param("reason") String reason,
                      @Param("projectId") Long projectId);

    @Query(value = """
            select coalesce(sum(delta), 0) from reputation_events
            where user_id = :userId and delta > 0 and reason in (:reasons) and created_at >= :since
            """, nativeQuery = true)
    int gainedSince(@Param("userId") Long userId, @Param("reasons") Collection<String> reasons,
                    @Param("since") Instant since);

    @Query(value = """
            select count(*) from reputation_events
            where user_id = :userId and delta > 0 and reason = :reason and created_at >= :since
            """, nativeQuery = true)
    int rewardsSince(@Param("userId") Long userId, @Param("reason") String reason, @Param("since") Instant since);

    @Query(value = """
            select count(*) from reputation_events
            where user_id = :userId and source_user_id = :sourceUserId and delta > 0
              and reason in (:reasons) and created_at >= :since
            """, nativeQuery = true)
    int rewardsFromSince(@Param("userId") Long userId, @Param("sourceUserId") Long sourceUserId,
                         @Param("reasons") Collection<String> reasons, @Param("since") Instant since);
}
