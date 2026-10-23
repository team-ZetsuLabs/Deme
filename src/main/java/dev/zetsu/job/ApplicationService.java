package dev.zetsu.job;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.job.ApplicationDtos.ApplicationTarget;
import dev.zetsu.job.ApplicationDtos.MissionApplicationRequest;
import dev.zetsu.job.ApplicationDtos.MyApplication;
import dev.zetsu.job.ApplicationDtos.ReceivedApplication;
import dev.zetsu.mission.Mission;
import dev.zetsu.mission.MissionDtos.Budget;
import dev.zetsu.mission.MissionService;
import dev.zetsu.mission.MissionStatus;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UserService;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
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
    private final MissionService missionService;
    private final NotificationService notifications;

    public ApplicationService(ApplicationRepository applications, JobService jobService, JobRepository jobs,
                              UserRepository users, UserService userService, CvStorage cvStorage,
                              MissionService missionService, NotificationService notifications) {
        this.applications = applications;
        this.jobService = jobService;
        this.jobs = jobs;
        this.users = users;
        this.userService = userService;
        this.cvStorage = cvStorage;
        this.missionService = missionService;
        this.notifications = notifications;
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
            notifications.notify(job.getRecruiter().getId(), NotificationType.APPLICATION_RECEIVED, me.id(),
                    NotificationService.target(NotificationTargetType.JOB, job.getId(), job.getTitle()), null);
            return toMine(a);
        } catch (RuntimeException e) {
            if (cvFile != null) {
                cvStorage.delete(cvFile);
            }
            throw e instanceof DataIntegrityViolationException ? alreadyApplied() : e;
        }
    }

    /** JOB-5 : se proposer sur une mission ouverte, avec un montant si l'on ne prend pas le budget indicatif. */
    @Transactional
    public MyApplication applyToMission(Long missionId, MissionApplicationRequest req, ZetsuPrincipal me) {
        Mission mission = missionService.load(missionId);
        if (MissionService.isAuthor(mission, me)) {
            throw ApiException.forbidden("CANNOT_APPLY_OWN", "Impossible de se proposer sur sa propre mission");
        }
        if (mission.getStatus() != MissionStatus.OPEN) {
            throw MissionService.notOpen();
        }
        String message = checkMessage(req.message());
        if (applications.existsByMissionIdAndCandidateId(missionId, me.id())) {
            throw alreadyProposed();
        }
        Budget budget = req.proposedBudget();
        try {
            Application a = applications.saveAndFlush(Application.forMission(users.getReferenceById(me.id()), mission,
                    message, budget == null ? null : budget.amount(), budget == null ? null : budget.currency()));
            notifications.notify(mission.getAuthor().getId(), NotificationType.APPLICATION_RECEIVED, me.id(),
                    NotificationService.target(NotificationTargetType.MISSION, mission.getId(), mission.getTitle()),
                    null);
            return toMine(a);
        } catch (DataIntegrityViolationException e) {
            throw alreadyProposed();
        }
    }

    /** JOB-7 : ce que l'auteur liste passe « vue ». L'équipe peut consulter sans changer le statut. */
    @Transactional
    public PageResponse<ReceivedApplication> receivedForMission(Long missionId, ApplicationStatus status, int page,
                                                                int size, ZetsuPrincipal me) {
        Mission mission = missionService.load(missionId);
        boolean author = MissionService.isAuthor(mission, me);
        if (!author && !JobService.isStaff(me)) {
            throw ApiException.forbidden("NOT_MISSION_AUTHOR", "Seul l'auteur de la mission peut voir les propositions");
        }
        var found = applications.findReceivedForMission(missionId, status, Paging.of(page, size));
        if (author) {
            found.forEach(Application::markViewed);
        }
        return PageResponse.of(found, this::toReceived);
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
        if (a.getMission() != null && decision == ApplicationStatus.SHORTLISTED) {
            a.getMission().start();
        }
        notifications.notify(a.getCandidate().getId(), NotificationType.APPLICATION_DECIDED, me.id(),
                NotificationService.target(NotificationTargetType.APPLICATION, a.getId(), target(a).title()),
                decision.name());
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
        return a.getJob() != null ? JobService.isOwner(a.getJob(), me) : MissionService.isAuthor(a.getMission(), me);
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

    private static ApiException alreadyProposed() {
        return ApiException.conflict("ALREADY_APPLIED", "Vous vous êtes déjà proposé sur cette mission");
    }

    private static ApplicationTarget target(Application a) {
        Job j = a.getJob();
        if (j == null) {
            Mission m = a.getMission();
            return new ApplicationTarget(ApplicationTargetType.MISSION, m.getId(), m.getTitle(), null);
        }
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
