package dev.zetsu.comment;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = "author")
    @Query("select c from Comment c where c.questionId = :questionId order by c.createdAt asc, c.id asc")
    List<Comment> findForQuestion(@Param("questionId") Long questionId);

    @EntityGraph(attributePaths = "author")
    @Query("select c from Comment c where c.answerId in :answerIds order by c.createdAt asc, c.id asc")
    List<Comment> findForAnswers(@Param("answerIds") Collection<Long> answerIds);

    @EntityGraph(attributePaths = "author")
    @Query("select c from Comment c where c.id = :id")
    Optional<Comment> findDetailed(@Param("id") Long id);
}
