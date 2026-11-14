package dev.zetsu.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommunityRepository extends JpaRepository<Community, Long> {

    @Query("select c from Community c left join fetch c.tag where c.slug = :slug")
    Optional<Community> findBySlug(String slug);

    @Query("select c from Community c left join fetch c.tag where c.id in :ids")
    List<Community> findAllDetailed(Collection<Long> ids);
}
