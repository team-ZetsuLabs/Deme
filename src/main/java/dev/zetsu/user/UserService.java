package dev.zetsu.user;

import dev.zetsu.answer.AnswerRepository;
import dev.zetsu.auth.OAuthAccountRepository;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.question.QuestionRepository;
import dev.zetsu.reputation.ReputationDtos.ReputationEntry;
import dev.zetsu.reputation.ReputationEventRepository;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.UserDtos.DeleteAccountRequest;
import dev.zetsu.user.UserDtos.Me;
import dev.zetsu.user.UserDtos.OnboardingRequest;
import dev.zetsu.user.UserDtos.PublicProfile;
import dev.zetsu.user.UserDtos.UpdateProfileRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UserService {

    private final UserRepository users;
    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final ReputationService reputation;
    private final TagService tags;
    private final OAuthAccountRepository oauthAccounts;
    private final ReputationEventRepository reputationEvents;
    private final ApplicationEventPublisher events;

    public UserService(UserRepository users, QuestionRepository questions, AnswerRepository answers,
                       ReputationService reputation, TagService tags, OAuthAccountRepository oauthAccounts,
                       ReputationEventRepository reputationEvents, ApplicationEventPublisher events) {
        this.users = users;
        this.questions = questions;
        this.answers = answers;
        this.reputation = reputation;
        this.tags = tags;
        this.oauthAccounts = oauthAccounts;
        this.reputationEvents = reputationEvents;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public Me me(Long id) {
        return toMe(users.findById(id).orElseThrow(UserService::notFound));
    }

    public Me toMe(User u) {
        return Me.from(u, reputation.levelOf(u.getReputation()));
    }

    @Transactional(readOnly = true)
    public PublicProfile profile(String username) {
        return profile(byUsername(username));
    }

    /** Profil public d'un membre déjà chargé, par exemple celui d'un candidat (JOB-3). */
    public PublicProfile profile(User u) {
        return new PublicProfile(u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getBio(),
                u.getCountryCode(), u.getCity(), u.getRole(), u.getReputation(),
                reputation.levelOf(u.getReputation()), u.isVisibleToRecruiters(), UserDtos.technologyNames(u),
                questions.countByAuthorId(u.getId()), answers.countByAuthorId(u.getId()), u.getCreatedAt());
    }

    @Transactional
    public Me update(Long id, UpdateProfileRequest req) {
        User u = users.findById(id).orElseThrow(UserService::notFound);
        u.setDisplayName(req.displayName().trim());
        u.setBio(blankToNull(req.bio()));
        u.setCountryCode(blankToNull(req.countryCode()));
        u.setCity(blankToNull(req.city()));
        u.setLanguage(req.language());
        u.setVisibleToRecruiters(req.visibleToRecruiters());
        if (req.technologies() != null) {
            u.setTechnologies(tags.resolve(req.technologies(), 0, UserDtos.MAX_TECHNOLOGIES));
        }
        return toMe(u);
    }

    /** AUTH-5 : la première fois marque l'accueil comme terminé ; ensuite, simple mise à jour des trois réglages. */
    @Transactional
    public Me completeOnboarding(Long id, OnboardingRequest req) {
        User u = users.findById(id).orElseThrow(UserService::notFound);
        u.setTechnologies(tags.resolve(req.technologies(), 1, UserDtos.MAX_TECHNOLOGIES));
        u.setCountryCode(req.countryCode().trim());
        u.setLanguage(req.language());
        if (u.getOnboardedAt() == null) {
            u.setOnboardedAt(Instant.now());
        }
        return toMe(u);
    }

    /**
     * AUTH-6 : contenus gardés sous « Utilisateur supprimé », réputation et comptes OAuth effacés. Les votes
     * restent pour ne pas changer les scores des autres. Les autres domaines réagissent à {@link AccountDeleted}.
     */
    @Transactional
    public void delete(Long id, DeleteAccountRequest req) {
        User u = users.findById(id).orElseThrow(UserService::notFound);
        if (!u.getUsername().equalsIgnoreCase(req.confirmation().trim())) {
            throw ApiException.badRequest("CONFIRMATION_MISMATCH", "Recopiez votre pseudo pour confirmer");
        }
        oauthAccounts.deleteByUserId(id);
        reputationEvents.deleteByUserId(id);
        events.publishEvent(new AccountDeleted(id));
        u.anonymize();
    }

    @Transactional(readOnly = true)
    public PageResponse<ReputationEntry> reputationHistory(String username, int page, int size) {
        return reputation.history(byUsername(username).getId(), page, size);
    }

    private User byUsername(String username) {
        return users.findByUsernameIgnoreCase(username).filter(u -> !u.isDeleted())
                .orElseThrow(UserService::notFound);
    }

    private static ApiException notFound() {
        return ApiException.notFound("USER_NOT_FOUND", "Membre introuvable");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
