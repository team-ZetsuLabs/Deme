package dev.zetsu.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByVoterIdAndTargetTypeAndTargetId(Long voterId, VoteTarget targetType, Long targetId);

    List<Vote> findByVoterIdAndTargetTypeAndTargetIdIn(Long voterId, VoteTarget targetType, Collection<Long> targetIds);

    @Modifying
    @Query("delete from Vote v where v.targetType = :type and v.targetId = :id")
    void deleteAllOn(@Param("type") VoteTarget type, @Param("id") Long id);
}
