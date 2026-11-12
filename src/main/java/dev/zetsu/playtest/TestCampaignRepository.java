package dev.zetsu.playtest;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;

public interface TestCampaignRepository extends JpaRepository<TestCampaign, Long> {

    @Query("select c from TestCampaign c join fetch c.owner where c.id = :id")
    Optional<TestCampaign> findDetailed(@Param("id") Long id);

    /** Verrou de la campagne : deux membres ne prennent jamais la dernière place en même temps. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from TestCampaign c where c.id = :id")
    Optional<TestCampaign> findForUpdate(@Param("id") Long id);

    /**
     * Liste publique : campagnes visibles dans les statuts demandés. {@code open} garde celles qui ont encore une
     * place, {@code full} celles qui n'en ont plus.
     */
    @Query(value = """
            select c from TestCampaign c join fetch c.owner
            where c.hidden = false and c.status in :statuses
              and (:open = false or (select count(p) from TestParticipation p
                                     where p.campaign = c and p.status in :taking) < c.testersTarget)
              and (:full = false or (select count(p) from TestParticipation p
                                     where p.campaign = c and p.status in :taking) >= c.testersTarget)
            order by coalesce(c.startedAt, c.createdAt) desc, c.id desc
            """, countQuery = """
            select count(c) from TestCampaign c
            where c.hidden = false and c.status in :statuses
              and (:open = false or (select count(p) from TestParticipation p
                                     where p.campaign = c and p.status in :taking) < c.testersTarget)
              and (:full = false or (select count(p) from TestParticipation p
                                     where p.campaign = c and p.status in :taking) >= c.testersTarget)
            """)
    Page<TestCampaign> search(@Param("statuses") Collection<CampaignStatus> statuses, @Param("open") boolean open,
                              @Param("full") boolean full,
                              @Param("taking") Collection<ParticipationStatus> taking, Pageable pageable);

    @Query(value = "select c from TestCampaign c join fetch c.owner where c.owner.id = :ownerId"
            + " order by c.createdAt desc, c.id desc",
            countQuery = "select count(c) from TestCampaign c where c.owner.id = :ownerId")
    Page<TestCampaign> findMine(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("""
            select count(c) > 0 from TestCampaign c
            where c.platform = :platform and lower(c.packageName) = lower(:packageName) and c.id <> :id
              and c.status in (dev.zetsu.playtest.CampaignStatus.PENDING_REVIEW, dev.zetsu.playtest.CampaignStatus.ACTIVE,
                               dev.zetsu.playtest.CampaignStatus.SUSPENDED)
            """)
    boolean packageRunningElsewhere(@Param("platform") Platform platform, @Param("packageName") String packageName,
                                    @Param("id") Long id);

    /** AUTH-6 : les campagnes non terminées d'un compte supprimé sont clôturées. */
    @Modifying
    @Query(value = """
            update test_campaigns set status = 'COMPLETED', completed_at = :now, updated_at = :now
            where owner_id = :ownerId and status <> 'COMPLETED'
            """, nativeQuery = true)
    int closeAllOf(@Param("ownerId") Long ownerId, @Param("now") Instant now);
}
