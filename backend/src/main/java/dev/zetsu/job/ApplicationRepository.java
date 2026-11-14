package dev.zetsu.job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);

    Optional<Application> findByJobIdAndCandidateId(Long jobId, Long candidateId);

    long countByJobId(Long jobId);

    boolean existsByMissionIdAndCandidateId(Long missionId, Long candidateId);

    Optional<Application> findByMissionIdAndCandidateId(Long missionId, Long candidateId);

    /** Nombre de propositions par mission, pour une page entière en une requête. */
    @Query("select a.mission.id, count(a) from Application a where a.mission.id in :missionIds group by a.mission.id")
    List<Object[]> countByMissions(@Param("missionIds") Collection<Long> missionIds);

    @EntityGraph(attributePaths = {"candidate", "job", "mission"})
    @Query("select a from Application a where a.id = :id")
    Optional<Application> findDetailed(@Param("id") Long id);

    @EntityGraph(attributePaths = {"candidate"})
    @Query("""
            select a from Application a where a.job.id = :jobId and (:status is null or a.status = :status)
            order by a.createdAt desc, a.id desc""")
    Page<Application> findReceivedForJob(@Param("jobId") Long jobId, @Param("status") ApplicationStatus status,
                                         Pageable pageable);

    @EntityGraph(attributePaths = {"candidate"})
    @Query("""
            select a from Application a where a.mission.id = :missionId and (:status is null or a.status = :status)
            order by a.createdAt desc, a.id desc""")
    Page<Application> findReceivedForMission(@Param("missionId") Long missionId,
                                             @Param("status") ApplicationStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"job", "mission"})
    @Query("""
            select a from Application a where a.candidate.id = :candidateId
              and (:status is null or a.status = :status)
              and ((:jobs = true and a.job is not null) or (:missions = true and a.mission is not null))
            order by a.createdAt desc, a.id desc""")
    Page<Application> findSentBy(@Param("candidateId") Long candidateId, @Param("status") ApplicationStatus status,
                                 @Param("jobs") boolean jobs, @Param("missions") boolean missions, Pageable pageable);

    @Query("select a.cvFile from Application a where a.candidate.id = :candidateId and a.cvFile is not null")
    List<String> cvFilesOf(@Param("candidateId") Long candidateId);

    /** AUTH-6 : les candidatures d'un compte supprimé sont effacées. */
    @Modifying
    @Query(value = "delete from applications where candidate_id = :candidateId", nativeQuery = true)
    void deleteAllOf(@Param("candidateId") Long candidateId);
}
