package dev.zetsu.playtest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TestFeedbackRepository extends JpaRepository<TestFeedback, Long> {

    /** Les plus récents d'abord. */
    @EntityGraph(attributePaths = "author")
    @Query(value = "select f from TestFeedback f where f.campaignId = :campaignId order by f.createdAt desc, f.id desc",
            countQuery = "select count(f) from TestFeedback f where f.campaignId = :campaignId")
    Page<TestFeedback> findForCampaign(@Param("campaignId") Long campaignId, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query("select f from TestFeedback f where f.id = :id")
    Optional<TestFeedback> findDetailed(@Param("id") Long id);
}
