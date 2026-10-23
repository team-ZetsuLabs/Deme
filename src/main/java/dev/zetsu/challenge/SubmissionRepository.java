package dev.zetsu.challenge;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByChallengeIdAndMemberId(Long challengeId, Long memberId);

    boolean existsByChallengeIdAndMemberId(Long challengeId, Long memberId);

    long countByChallengeId(Long challengeId);

    @EntityGraph(attributePaths = "member")
    @Query("select s from Submission s where s.id = :id")
    Optional<Submission> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = "member")
    @Query("""
            select s from Submission s where s.challengeId = :challengeId and s.status = :status
            order by s.submittedAt asc, s.id asc""")
    Page<Submission> findForReview(@Param("challengeId") Long challengeId, @Param("status") SubmissionStatus status,
                                   Pageable pageable);

    interface LeaderboardRow {
        Long getId();

        int getRank();
    }

    /** CH-1 : dépôts validés, meilleure note d'abord ; deux notes égales partagent le même rang. */
    @Query(value = """
            select id, cast(rank() over (order by score desc) as integer) as rank from submissions
            where challenge_id = :challengeId and status = 'VALIDATED'
            order by score desc, submitted_at asc, id asc
            limit :limit offset :offset""", nativeQuery = true)
    List<LeaderboardRow> leaderboard(@Param("challengeId") Long challengeId, @Param("limit") int limit,
                                     @Param("offset") long offset);

    @Query("select count(s) from Submission s where s.challengeId = :challengeId and s.status = 'VALIDATED'")
    long countValidated(@Param("challengeId") Long challengeId);

    @EntityGraph(attributePaths = "member")
    @Query("select s from Submission s where s.id in :ids")
    List<Submission> findAllDetailed(@Param("ids") List<Long> ids);
}
