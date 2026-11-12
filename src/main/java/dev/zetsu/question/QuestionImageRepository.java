package dev.zetsu.question;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface QuestionImageRepository extends JpaRepository<QuestionImage, String> {

    List<QuestionImage> findByQuestionIdOrderByPositionAsc(Long questionId);

    Optional<QuestionImage> findByStorageRef(String storageRef);

    /** Images envoyées mais jamais rattachées à une question. */
    @Query("select i from QuestionImage i where i.questionId is null and i.createdAt < :before")
    List<QuestionImage> findOrphansBefore(@Param("before") Instant before);
}
