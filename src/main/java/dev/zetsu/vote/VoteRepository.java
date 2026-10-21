package dev.zetsu.vote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByVoterIdAndTargetTypeAndTargetId(Long voterId, VoteTarget targetType, Long targetId);

    List<Vote> findByVoterIdAndTargetTypeAndTargetIdIn(Long voterId, VoteTarget targetType, Collection<Long> targetIds);
}
