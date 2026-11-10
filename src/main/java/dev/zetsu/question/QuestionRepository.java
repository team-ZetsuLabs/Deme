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

    long countByAuthorIdAndDeletedAtIsNull(Long authorId);

    @Modifying(flushAutomatically = true)
    @Query(value = "update questions set score = score + :delta where id = :id", nativeQuery = true)
    void addScore(@Param("id") Long id, @Param("delta") int delta);

    /** 0 si la question vient d'être supprimée : la réponse ne doit pas être enregistrée. */
    @Modifying(flushAutomatically = true)
    @Query(value = "update questions set answer_count = answer_count + :delta where id = :id and deleted_at is null",
            nativeQuery = true)
    int addAnswerCount(@Param("id") Long id, @Param("delta") int delta);

    /**
     * QA-3 : supprime (et masque) la question seulement si elle n'a aucune réponse, en une seule requête. Avec
     * {@link #addAnswerCount}, une réponse envoyée au même moment ne peut pas tomber sur une question supprimée.
     *
     * @return 1 si la question est supprimée, 0 si elle a déjà une réponse ou est déjà supprimée
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            update questions set deleted_at = now(), hidden = true
            where id = :id and deleted_at is null and answer_count = 0
            """, nativeQuery = true)
    int softDelete(@Param("id") Long id);

    @Query(value = "select score from questions where id = :id", nativeQuery = true)
    int currentScore(@Param("id") Long id);
}
