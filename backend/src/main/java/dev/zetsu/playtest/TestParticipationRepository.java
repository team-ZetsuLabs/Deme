package dev.zetsu.playtest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TestParticipationRepository extends JpaRepository<TestParticipation, Long> {

    @Query("""
            select p from TestParticipation p join fetch p.tester
            where p.campaign.id = :campaignId order by p.joinedAt asc, p.id asc
            """)
    List<TestParticipation> findAllOf(@Param("campaignId") Long campaignId);

    @Query("select p from TestParticipation p where p.campaign.id in :campaignIds")
    List<TestParticipation> findAllOfCampaigns(@Param("campaignIds") Collection<Long> campaignIds);

    Optional<TestParticipation> findByCampaignIdAndTesterId(Long campaignId, Long testerId);

    long countByCampaignIdAndStatusIn(Long campaignId, Collection<ParticipationStatus> statuses);

    @Query(value = """
            select p from TestParticipation p join fetch p.campaign c join fetch c.owner
            where p.tester.id = :testerId order by p.joinedAt desc, p.id desc
            """, countQuery = "select count(p) from TestParticipation p where p.tester.id = :testerId")
    Page<TestParticipation> findMine(@Param("testerId") Long testerId, Pageable pageable);

    /** Place libérée (désistement, retrait) que personne n'a encore reprise, la plus ancienne d'abord. */
    @Query("""
            select p from TestParticipation p
            where p.campaign.id = :campaignId
              and p.status in (dev.zetsu.playtest.ParticipationStatus.DROPPED, dev.zetsu.playtest.ParticipationStatus.REMOVED)
              and not exists (select r from TestParticipation r where r.replacesId = p.id)
            order by p.droppedAt asc, p.id asc
            """)
    List<TestParticipation> freedSpots(@Param("campaignId") Long campaignId, Pageable pageable);

    @Query("""
            select p from TestParticipation p join fetch p.campaign c join fetch p.tester
            where p.status in :statuses
            """)
    List<TestParticipation> findRunning(@Param("statuses") Collection<ParticipationStatus> statuses);

    /** Section 9 : l'adresse Google est effacée 30 jours après la fin de la participation. */
    @Modifying
    @Query(value = """
            update test_participations set google_email = null
            where google_email is not null and coalesce(completed_at, dropped_at) < :before
            """, nativeQuery = true)
    int eraseEmailsEndedBefore(@Param("before") Instant before);

    /** AUTH-6 : un compte supprimé quitte ses tests en cours, et ses adresses Google sont effacées. */
    @Modifying
    @Query(value = """
            update test_participations
            set status = case when status in ('JOINED', 'CONFIRMED', 'VERIFIED') then 'DROPPED' else status end,
                dropped_at = case when status in ('JOINED', 'CONFIRMED', 'VERIFIED') then :now else dropped_at end,
                drop_reason = case when status in ('JOINED', 'CONFIRMED', 'VERIFIED') then 'Compte supprimé'
                                   else drop_reason end,
                google_email = null
            where tester_id = :testerId
            """, nativeQuery = true)
    int leaveAllOf(@Param("testerId") Long testerId, @Param("now") Instant now);
}
