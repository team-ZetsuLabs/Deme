package dev.zetsu.project;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @EntityGraph(attributePaths = {"owner", "technologies"})
    @Query("select p from Project p where p.id = :id")
    Optional<Project> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = {"owner", "technologies"})
    @Query("select distinct p from Project p where p.id in :ids")
    List<Project> findAllDetailed(@Param("ids") Collection<Long> ids);

    /** Section 5.2 : 60 jours sans activité, le projet passe « En pause ». */
    @Modifying
    @Query(value = "update projects set status = 'PAUSED', updated_at = now() where status in ('OPEN', 'IN_PROGRESS')"
            + " and last_activity_at < :before", nativeQuery = true)
    int pauseInactiveSince(@Param("before") Instant before);

    /** AUTH-6 : les projets d'un membre supprimé sont clôturés, sans points pour l'équipe. */
    @Modifying
    @Query(value = "update projects set status = 'CLOSED', updated_at = now() where owner_id = :ownerId"
            + " and status <> 'CLOSED'", nativeQuery = true)
    void closeAllOf(@Param("ownerId") Long ownerId);
}
