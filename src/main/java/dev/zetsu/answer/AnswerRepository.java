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

    /** Réponse acceptée en tête, puis par score, puis la plus ancienne d'abord. */
    @EntityGraph(attributePaths = "author")
    @Query(value = """
            select a from Answer a
            where a.questionId = :questionId
            order by case when a.id = :acceptedId then 0 else 1 end, a.score desc, a.createdAt asc, a.id asc
            """,
            countQuery = "select count(a) from Answer a where a.questionId = :questionId")
    Page<Answer> findForQuestion(@Param("questionId") Long questionId, @Param("acceptedId") Long acceptedId,
                                 Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select a from Answer a where a.id = :id")
    Optional<Answer> findDetailed(@Param("id") Long id);

    long countByAuthorId(Long authorId);

    @Modifying(flushAutomatically = true)
    @Query(value = "update answers set score = score + :delta where id = :id", nativeQuery = true)
    void addScore(@Param("id") Long id, @Param("delta") int delta);

    @Query(value = "select score from answers where id = :id", nativeQuery = true)
    int currentScore(@Param("id") Long id);
}
