package dev.zetsu.challenge;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    @EntityGraph(attributePaths = "technologies")
    @Query("select c from Challenge c where c.id = :id")
    Optional<Challenge> findDetailed(@Param("id") Long id);

    /** Le défi en cours, sinon le dernier terminé (son classement reste visible). */
    @Query("""
            select c from Challenge c where c.startsAt <= :now
            order by case when c.endsAt > :now then 0 else 1 end, c.endsAt desc, c.id desc""")
    List<Challenge> findCurrent(@Param("now") Instant now, Pageable pageable);

    @Query("""
            select c from Challenge c
            where (:status is null
                   or (:status = 'UPCOMING' and c.startsAt > :now)
                   or (:status = 'OPEN' and c.startsAt <= :now and c.endsAt > :now)
                   or (:status = 'CLOSED' and c.endsAt <= :now))
            order by c.startsAt desc, c.id desc""")
    Page<Challenge> findForTeam(@Param("status") String status, @Param("now") Instant now, Pageable pageable);

    @Query("""
            select count(c) > 0 from Challenge c
            where c.startsAt < :endsAt and c.endsAt > :startsAt and (:exceptId is null or c.id <> :exceptId)""")
    boolean overlaps(@Param("startsAt") Instant startsAt, @Param("endsAt") Instant endsAt,
                     @Param("exceptId") Long exceptId);

    /** Sérialise les créations et modifications : deux défis ne doivent jamais se chevaucher. */
    @Modifying
    @Query(value = "lock table challenges in share row exclusive mode", nativeQuery = true)
    void lockForWrite();

    @Query("select c from Challenge c where c.startNotified = false and c.startsAt <= :now and c.endsAt > :now")
    List<Challenge> findStartedNotNotified(@Param("now") Instant now);
}
