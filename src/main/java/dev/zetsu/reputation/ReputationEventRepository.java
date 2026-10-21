package dev.zetsu.reputation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReputationEventRepository extends JpaRepository<ReputationEvent, Long> {

    Page<ReputationEvent> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);
}
