package dev.zetsu.mission;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    @EntityGraph(attributePaths = {"author", "technologies"})
    @Query("select m from Mission m where m.id = :id")
    Optional<Mission> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = {"author", "technologies"})
    @Query("select distinct m from Mission m where m.id in :ids")
    List<Mission> findAllDetailed(@Param("ids") Collection<Long> ids);

    /** AUTH-6 : les missions d'un membre supprimé sont closes. */
    @Modifying
    @Query(value = "update missions set status = 'CLOSED', updated_at = now() where author_id = :authorId"
            + " and status <> 'CLOSED'", nativeQuery = true)
    void closeAllOf(@Param("authorId") Long authorId);
}
