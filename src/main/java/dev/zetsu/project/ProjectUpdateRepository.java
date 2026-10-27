package dev.zetsu.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectUpdateRepository extends JpaRepository<ProjectUpdate, Long> {

    @EntityGraph(attributePaths = {"author"})
    Page<ProjectUpdate> findByProjectIdOrderByCreatedAtDescIdDesc(Long projectId, Pageable pageable);
}
