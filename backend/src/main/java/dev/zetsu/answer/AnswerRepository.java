package dev.zetsu.answer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /**
     * Réponse acceptée en tête, puis par score, puis la plus ancienne d'abord. Les réponses masquées (MOD-2) ne
     * restent visibles que pour leur auteur et l'équipe.
     */
    @EntityGraph(attributePaths = "author")
    @Query(value = """
            select a from Answer a
            where a.questionId = :questionId
              and (a.hidden = false or a.author.id = :viewerId or :staff = true)
            order by case when a.id = :acceptedId then 0 else 1 end, a.score desc, a.createdAt asc, a.id asc
            """,
            countQuery = """
                    select count(a) from Answer a where a.questionId = :questionId
                      and (a.hidden = false or a.author.id = :viewerId or :staff = true)
                    """)
    Page<Answer> findForQuestion(@Param("questionId") Long questionId, @Param("acceptedId") Long acceptedId,
                                 @Param("viewerId") Long viewerId, @Param("staff") boolean staff, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select a from Answer a where a.id = :id")
    Optional<Answer> findDetailed(@Param("id") Long id);

    long countByAuthorId(Long authorId);

    /** Réponses acceptées comme solution, hors réponses masquées (MOD-2), comme le badge Résolveur. */
    @Query(value = """
            select count(*) from answers a join questions q on q.accepted_answer_id = a.id
            where a.author_id = :authorId and not a.hidden
            """, nativeQuery = true)
    long countAcceptedByAuthorId(@Param("authorId") Long authorId);

    @Modifying(flushAutomatically = true)
    @Query(value = "update answers set score = score + :delta where id = :id", nativeQuery = true)
    void addScore(@Param("id") Long id, @Param("delta") int delta);

    @Query(value = "select score from answers where id = :id", nativeQuery = true)
    int currentScore(@Param("id") Long id);
}
