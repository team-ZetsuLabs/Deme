package dev.zetsu.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByCaseIdAndReporterId(Long caseId, Long reporterId);
}
