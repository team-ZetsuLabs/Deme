package dev.zetsu.job;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.job.ApplicationDtos.ApplicationTarget;
import dev.zetsu.job.ApplicationDtos.MyApplication;
import dev.zetsu.job.ApplicationDtos.ReceivedApplication;
import dev.zetsu.mission.MissionDtos.Budget;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UserService;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class ApplicationService {

    public static final int MESSAGE_MIN = 40;
    public static final int MESSAGE_MAX = 2000;

    private final ApplicationRepository applications;
    private final JobService jobService;
    private final JobRepository jobs;
    private final UserRepository users;
    private final UserService userService;
    private final CvStorage cvStorage;

    public ApplicationService(ApplicationRepository applications, JobService jobService, JobRepository jobs,
                              UserRepository users, UserService userService, CvStorage cvStorage) {
        this.applications = applications;
        this.jobService = jobService;
        this.jobs = jobs;
        this.users = users;
        this.userService = userService;
        this.cvStorage = cvStorage;
    }

    /** JOB-3 : le profil Zetsu part avec la candidature ; le CV est facultatif. */
    @Transactional
    public MyApplication applyToJob(Long jobId, String rawMessage, MultipartFile cv, ZetsuPrincipal me) {
        Job job = jobService.loadVisible(jobId, me);
        if (JobService.isOwner(job, me)) {
            throw ApiException.forbidden("CANNOT_APPLY_OWN", "Impossible de postuler à sa propre offre");
        }
        if (job.getStatus() != JobStatus.PUBLISHED) {
            throw ApiException.conflict("JOB_CLOSED", "Cette offre n'accepte plus de candidatures");
        }
        String message = checkMessage(rawMessage);
        if (applications.existsByJobIdAndCandidateId(jobId, me.id())) {
            throw alreadyApplied();
        }
        String cvFile = cv == null || cv.isEmpty() ? null : cvStorage.store(cv);
        try {
            Application a = applications.saveAndFlush(
                    Application.forJob(users.getReferenceById(me.id()), job, message, cvFile));
            return toMine(a);
        } catch (RuntimeException e) {
            if (cvFile != null) {
                cvStorage.delete(cvFile);
            }
            throw e instanceof DataIntegrityViolationException ? alreadyApplied() : e;
        }
    }

    /** JOB-7 : ce que le recruteur liste passe « vue ». L'équipe peut consulter sans changer le statut. */
    @Transactional
    public PageResponse<ReceivedApplication> receivedForJob(Long jobId, ApplicationStatus status, int page, int size,
                                                            ZetsuPrincipal me) {
        Job job = jobService.loadVisible(jobId, me);
        boolean owner = JobService.isOwner(job, me);
        if (!owner && !JobService.isStaff(me)) {
            throw ApiException.forbidden("NOT_JOB_OWNER", "Seul le recruteur de l'offre peut voir les candidatures");
        }
        var found = applications.findReceivedForJob(jobId, status, Paging.of(page, size));
        if (owner) {
            found.forEach(Application::markViewed);
        }
        return PageResponse.of(found, this::toReceived);
    }

    @Transactional
    public ReceivedApplication decide(Long id, ApplicationStatus decision, ZetsuPrincipal me) {
        Application a = load(id);
        if (!isTargetOwner(a, me)) {
            throw ApiException.forbidden("NOT_TARGET_OWNER", "Seul le destinataire de la candidature peut décider");
        }
        if (decision != ApplicationStatus.SHORTLISTED && decision != ApplicationStatus.REJECTED) {
            throw ApiException.badRequest("INVALID_STATUS", "Statut attendu : SHORTLISTED ou REJECTED");
        }
        a.setStatus(decision);
        return toReceived(a);
    }

    public record CvDownload(Resource file, String filename) {
    }

    @Transactional(readOnly = true)
    public CvDownload cv(Long id, ZetsuPrincipal me) {
        Application a = load(id);
        boolean allowed = a.getCandidate().getId().equals(me.id()) || isTargetOwner(a, me) || JobService.isStaff(me);
        if (!allowed) {
            throw ApiException.forbidden("FORBIDDEN", "Action interdite");
        }
        if (a.getCvFile() == null) {
            throw ApiException.notFound("CV_NOT_FOUND", "Aucun CV joint à cette candidature");
        }
        return new CvDownload(cvStorage.load(a.getCvFile()), "cv-" + a.getCandidate().getUsername() + ".pdf");
    }

    @Transactional(readOnly = true)
    public PageResponse<MyApplication> sentBy(ZetsuPrincipal me, ApplicationTargetType type, ApplicationStatus status,
                                              int page, int size) {
        boolean jobsToo = type == null || type == ApplicationTargetType.JOB;
        boolean missionsToo = type == null || type == ApplicationTargetType.MISSION;
        return PageResponse.of(applications.findSentBy(me.id(), status, jobsToo, missionsToo, Paging.of(page, size)),
                this::toMine);
    }

    /** AUTH-6 : candidatures effacées, CV supprimés une fois la suppression validée ; offres du recruteur closes. */
    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        List<String> files = applications.cvFilesOf(event.userId());
        applications.deleteAllOf(event.userId());
        jobs.closeAllOf(event.userId());
        if (!files.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    files.forEach(cvStorage::delete);
                }
            });
        }
    }

    private Application load(Long id) {
        return applications.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND", "Candidature introuvable"));
    }

    private static boolean isTargetOwner(Application a, ZetsuPrincipal me) {
        return a.getJob() != null && JobService.isOwner(a.getJob(), me);
    }

    private static String checkMessage(String raw) {
        String message = raw == null ? "" : raw.trim();
        if (message.isEmpty()) {
            throw ApiException.invalidField("message", "Obligatoire");
        }
        if (message.length() < MESSAGE_MIN || message.length() > MESSAGE_MAX) {
            throw ApiException.invalidField("message", "Entre " + MESSAGE_MIN + " et " + MESSAGE_MAX + " caractères");
        }
        return message;
    }

    private static ApiException alreadyApplied() {
        return ApiException.conflict("ALREADY_APPLIED", "Vous avez déjà postulé à cette offre");
    }

    private static ApplicationTarget target(Application a) {
        Job j = a.getJob();
        return new ApplicationTarget(ApplicationTargetType.JOB, j.getId(), j.getTitle(), j.getCompanyName());
    }

    private static Budget proposed(Application a) {
        return a.getProposedAmount() == null ? null : new Budget(a.getProposedAmount(), a.getProposedCurrency());
    }

    private MyApplication toMine(Application a) {
        return new MyApplication(a.getId(), target(a), a.getStatus(), a.getMessage(), a.getCvFile() != null,
                proposed(a), a.getCreatedAt(), a.getUpdatedAt());
    }

    private ReceivedApplication toReceived(Application a) {
        User candidate = a.getCandidate();
        return new ReceivedApplication(a.getId(), target(a), userService.profile(candidate), a.getMessage(),
                a.getCvFile() != null, proposed(a), a.getStatus(), a.getCreatedAt(), a.getUpdatedAt());
    }
}
