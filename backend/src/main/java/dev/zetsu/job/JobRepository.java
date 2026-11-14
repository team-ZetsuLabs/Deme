package dev.zetsu.job;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long> {

    @EntityGraph(attributePaths = {"recruiter", "technologies"})
    @Query("select j from Job j where j.id = :id")
    Optional<Job> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = {"recruiter", "technologies"})
    @Query("select distinct j from Job j where j.id in :ids")
    List<Job> findAllDetailed(@Param("ids") Collection<Long> ids);

    /** AUTH-6 : les offres d'un recruteur supprimé ne restent pas ouvertes. */
    @Modifying
    @Query(value = "update jobs set status = 'CLOSED', updated_at = now() where recruiter_id = :recruiterId"
            + " and status in ('PENDING', 'PUBLISHED')", nativeQuery = true)
    void closeAllOf(@Param("recruiterId") Long recruiterId);
}
