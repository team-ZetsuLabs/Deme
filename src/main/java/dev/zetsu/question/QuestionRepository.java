package dev.zetsu.question;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @EntityGraph(attributePaths = {"author", "tags"})
    @Query("select q from Question q where q.id = :id")
    Optional<Question> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = {"author", "tags"})
    @Query("select q from Question q where q.id in :ids")
    List<Question> findAllDetailed(@Param("ids") Collection<Long> ids);

    long countByAuthorId(Long authorId);

    @Modifying(flushAutomatically = true)
    @Query(value = "update questions set score = score + :delta where id = :id", nativeQuery = true)
    void addScore(@Param("id") Long id, @Param("delta") int delta);

    @Modifying(flushAutomatically = true)
    @Query(value = "update questions set answer_count = answer_count + :delta where id = :id", nativeQuery = true)
    void addAnswerCount(@Param("id") Long id, @Param("delta") int delta);

    @Query(value = "select score from questions where id = :id", nativeQuery = true)
    int currentScore(@Param("id") Long id);
}
