package dev.zetsu.playtest;

import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Tests fermés : Google Play, App Store (TestFlight) et applications web (TST-1 à TST-7). */
public final class PlaytestDtos {

    private PlaytestDtos() {
    }

    /** Identifiant d'application Android : au moins deux segments, chacun commence par une lettre. */
    static final String PACKAGE_NAME = "^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$";
    /** Bundle ID Apple : au moins deux segments de lettres, chiffres et tirets. */
    static final String BUNDLE_ID = "^[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$";
    /** Lien d'inscription au test : page de test Google Play ou groupe Google. Jamais suivi par le serveur. */
    static final String OPT_IN_URL =
            "^https://(play\\.google\\.com/apps/testing/|groups\\.google\\.com/)[^\\s<>\"']*$";
    /** Lien public TestFlight. */
    static final String TESTFLIGHT_URL = "^https://testflight\\.apple\\.com/join/[A-Za-z0-9]+$";
    /** Adresse d'une application web : https seulement, avec un vrai nom de domaine. */
    static final String WEB_URL = "^https://[A-Za-z0-9.-]+\\.[A-Za-z]{2,}(:[0-9]{1,5})?(/[^\\s<>\"']*)?$";

    @Schema(name = "PlaytestRequest", description = """
            Création ou modification d'une campagne (brouillon ou refusée). Les règles dépendent de platform. \
            GOOGLE_PLAY : packageName Android obligatoire ; optInUrl https://play.google.com/apps/testing/… ou \
            https://groups.google.com/… ; testersTarget de 12 à 100 (14 par défaut) ; requiredDays de 14 à 60 (14). \
            APP_STORE : packageName = Bundle ID obligatoire ; optInUrl https://testflight.apple.com/join/… ; \
            testersTarget de 1 à 100 (10) ; requiredDays de 1 à 60 (7). \
            WEB : packageName ignoré (toujours null) ; optInUrl = adresse https du site à tester ; testersTarget de 1 \
            à 100 (10) ; requiredDays ignoré (toujours 0, pas de décompte) ; toujours relue par l'équipe. \
            Une règle non respectée revient en VALIDATION_ERROR avec le champ en cause dans fields.""")
    public record PlaytestRequest(
            @NotNull(message = "Obligatoire")
            @Schema(requiredMode = REQUIRED, example = "GOOGLE_PLAY") Platform platform,

            @NotBlank(message = "Obligatoire") @Size(min = 2, max = 80, message = "Entre 2 et 80 caractères")
            @Schema(requiredMode = REQUIRED, example = "Tontine Cash") String appName,

            @Size(max = 150, message = "150 caractères maximum")
            @Schema(description = "Obligatoire pour GOOGLE_PLAY (com.exemple.app) et APP_STORE (Bundle ID), "
                    + "ignoré pour WEB", example = "sn.tontinecash.app") String packageName,

            @NotBlank(message = "Obligatoire") @Size(min = 30, max = 5000, message = "Entre 30 et 5000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.") String description,

            @NotBlank(message = "Obligatoire") @Size(max = 300, message = "300 caractères maximum")
            @Schema(requiredMode = REQUIRED, description = "Format selon platform (voir PlaytestRequest)",
                    example = "https://play.google.com/apps/testing/sn.tontinecash.app")
            String optInUrl,

            @Min(value = 1, message = "1 testeur au moins") @Max(value = 100, message = "100 testeurs au plus")
            @Schema(description = "Minimum et défaut selon platform ; Google en exige 12", example = "14")
            Integer testersTarget,

            @Min(value = 0, message = "0 jour au moins") @Max(value = 60, message = "60 jours au plus")
            @Schema(description = "Jours de test par testeur. Bornes et défaut selon platform ; ignoré pour WEB",
                    example = "14") Integer requiredDays,

            @Schema(description = "Date de début souhaitée, à titre indicatif", example = "2026-11-17")
            LocalDate desiredStart,

            @Size(max = 2000, message = "2000 caractères maximum")
            @Schema(description = "Consignes aux testeurs, texte brut",
                    example = "Créez une tontine de test et invitez un ami. Signalez tout plantage dans le groupe.")
            String instructions) {
    }

    @Schema(name = "PlaytestConfirmRequest", description = "Déclaration d'installation")
    public record ConfirmRequest(
            @Email(message = "Adresse email invalide") @Size(max = 254, message = "254 caractères maximum")
            @Schema(description = "Adresse du compte Google utilisé sur le téléphone, si le porteur gère sa liste de "
                    + "testeurs par adresse. Visible du porteur et de l'équipe seulement, effacée 30 jours après la "
                    + "fin.", example = "aminata.diallo@gmail.com") String googleEmail) {
    }

    @Schema(name = "PlaytestWithdrawRequest", description = "Désistement, motif facultatif")
    public record WithdrawRequest(
            @Size(max = 300, message = "300 caractères maximum") @Schema(example = "Mon téléphone est en panne")
            String reason) {
    }

    @Schema(name = "PlaytestRemoveRequest", description = "Retrait d'un testeur, avec un motif montré au testeur")
    public record RemoveRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 5, max = 300, message = "Entre 5 et 300 caractères")
            @Schema(requiredMode = REQUIRED, example = "Absent de la liste des testeurs de la Play Console")
            String reason) {
    }

    public enum ReviewDecision { APPROVE, REJECT }

    @Schema(name = "PlaytestReviewRequest", description = "Décision de l'équipe ; motif obligatoire pour REJECT")
    public record ReviewRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ReviewDecision decision,
            @Size(max = 300, message = "300 caractères maximum")
            @Schema(example = "Le lien d'inscription ne mène pas à un test fermé") String note) {
    }

    @Schema(name = "PlaytestNoteRequest", description = "Suspension ou réactivation ; motif obligatoire pour suspendre")
    public record NoteRequest(
            @Size(max = 300, message = "300 caractères maximum")
            @Schema(example = "Plusieurs testeurs signalent une application qui demande des accès abusifs")
            String note) {
    }

    @Schema(name = "PlaytestProgress", description = """
            Avancement. DAILY : percent = jours effectués par les testeurs en cours et terminés, rapportés à \
            testersTarget × requiredDays. NONE : testeurs qui ont déclaré l'installation (en cours et terminés), \
            rapportés à testersTarget. Ce ne sont que des déclarations : jamais une conformité d'un store.""")
    public record Progress(
            @Schema(requiredMode = REQUIRED, example = "42") int percent,
            @Schema(requiredMode = REQUIRED, description = "Participations terminées", example = "3") int completed,
            @Schema(requiredMode = REQUIRED, description = "En cours, vérifiées par le porteur", example = "5")
            int verified,
            @Schema(requiredMode = REQUIRED, description = "En cours, déclarées par le testeur seulement",
                    example = "4") int declared,
            @Schema(requiredMode = REQUIRED, description = "Ont rejoint, installation pas encore déclarée",
                    example = "1") int joined) {
    }

    @Schema(name = "PlaytestSummary", description = "Campagne dans une liste")
    public record PlaytestSummary(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String appName,
            @Schema(description = "Identifiant Android ou Bundle ID ; null pour WEB") String packageName,
            @Schema(requiredMode = REQUIRED) Platform platform,
            @Schema(requiredMode = REQUIRED, description = "Déduit de platform : NONE pour WEB") Tracking tracking,
            String iconUrl,
            @Schema(requiredMode = REQUIRED) AuthorSummary owner,
            @Schema(requiredMode = REQUIRED) CampaignStatus status,
            @Schema(requiredMode = REQUIRED) int testersTarget,
            @Schema(requiredMode = REQUIRED, description = "0 quand tracking vaut NONE") int requiredDays,
            @Schema(requiredMode = REQUIRED, description = "Places libres ; 0 : campagne complète") int spotsLeft,
            @Schema(requiredMode = REQUIRED) Progress progress,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            Instant startedAt) {
    }

    @Schema(name = "MyPlaytestParticipation", description = "Ma participation à une campagne")
    public record MyParticipation(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) ParticipationStatus status,
            @Schema(description = "Null tant que l'installation n'est pas déclarée, et après un départ")
            ProofLevel proofLevel,
            @Schema(requiredMode = REQUIRED, description = "Sans décompte (NONE) : jours depuis l'installation")
            int daysDone,
            @Schema(requiredMode = REQUIRED, description = "0 quand la campagne n'a pas de décompte")
            int requiredDays,
            @Schema(requiredMode = REQUIRED) Instant joinedAt,
            @Schema(description = "Avant cette date, l'installation doit être déclarée, sinon la place se libère")
            Instant confirmBefore,
            Instant confirmedAt,
            Instant verifiedAt,
            Instant endsAt,
            Instant lastCheckInAt,
            @Schema(requiredMode = REQUIRED, description = "« Toujours inscrit » déjà fait aujourd'hui (UTC)")
            boolean checkedInToday,
            @Schema(requiredMode = REQUIRED, description = "3 jours sans « toujours inscrit »") boolean needsAttention,
            String googleEmail,
            Instant completedAt,
            Instant droppedAt,
            @Schema(description = "Motif d'un désistement ou d'un retrait") String dropReason) {
    }

    @Schema(name = "PlaytestDetail", description = "Page d'une campagne")
    public record PlaytestDetail(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String appName,
            @Schema(description = "Identifiant Android ou Bundle ID ; null pour WEB") String packageName,
            @Schema(requiredMode = REQUIRED) Platform platform,
            @Schema(requiredMode = REQUIRED, description = "Déduit de platform : NONE pour WEB") Tracking tracking,
            String iconUrl,
            @Schema(requiredMode = REQUIRED) String descriptionMarkdown,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String descriptionHtml,
            @Schema(description = "Lien d'inscription au test : seulement pour le porteur, l'équipe et les testeurs "
                    + "en cours. À ouvrir dans un nouvel onglet.") String optInUrl,
            @Schema(description = "Seulement pour le porteur, l'équipe et les testeurs") String instructions,
            @Schema(requiredMode = REQUIRED) AuthorSummary owner,
            @Schema(requiredMode = REQUIRED) CampaignStatus status,
            @Schema(description = "Motif d'un refus ou d'une suspension : seulement pour le porteur et l'équipe")
            String reviewNote,
            @Schema(requiredMode = REQUIRED) int testersTarget,
            @Schema(requiredMode = REQUIRED, description = "0 quand tracking vaut NONE") int requiredDays,
            @Schema(requiredMode = REQUIRED) int spotsLeft,
            @Schema(requiredMode = REQUIRED) Progress progress,
            @Schema(description = "Quand toutes les places sont prises par des installations déclarées : fin du "
                    + "dernier testeur. Null sinon.") Instant estimatedEndAt,
            LocalDate desiredStart,
            @Schema(description = "Null si je ne participe pas (ou si je ne suis pas connecté)")
            MyParticipation myParticipation,
            @Schema(requiredMode = REQUIRED, description = "Brouillon ou refusée, et je suis le porteur") boolean canEdit,
            @Schema(requiredMode = REQUIRED, description = "Brouillon, et je suis le porteur") boolean canSubmit,
            @Schema(requiredMode = REQUIRED, description = "Active ou suspendue, et je suis le porteur")
            boolean canClose,
            @Schema(requiredMode = REQUIRED, description = """
                    Active, une place libre, je ne suis pas le porteur et je n'ai jamais rejoint. Faux aussi pour un \
                    visiteur non connecté : le front l'invite alors à se connecter.""") boolean canJoin,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt,
            Instant startedAt,
            Instant completedAt) {
    }

    @Schema(name = "PlaytestParticipation", description = "Testeur vu par le porteur ou l'équipe")
    public record ParticipationView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) AuthorSummary tester,
            @Schema(requiredMode = REQUIRED) ParticipationStatus status,
            ProofLevel proofLevel,
            @Schema(requiredMode = REQUIRED) int daysDone,
            @Schema(requiredMode = REQUIRED) Instant joinedAt,
            Instant confirmedAt,
            Instant verifiedAt,
            Instant endsAt,
            Instant lastCheckInAt,
            @Schema(requiredMode = REQUIRED, description = "« À confirmer » : 3 jours sans « toujours inscrit »")
            boolean needsAttention,
            @Schema(description = "Adresse Google déclarée, effacée 30 jours après la fin") String googleEmail,
            Instant completedAt,
            Instant droppedAt,
            String dropReason,
            @Schema(description = "Participation dont ce testeur a repris la place") Long replacesId) {
    }

    @Schema(name = "MyPlaytestEntry", description = "Une de mes participations, avec sa campagne")
    public record MyPlaytestEntry(
            @Schema(requiredMode = REQUIRED) PlaytestSummary campaign,
            @Schema(requiredMode = REQUIRED) MyParticipation participation) {
    }

    @Schema(name = "PlaytestEvent", description = "Ligne de l'historique d'une campagne")
    public record EventView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) PlaytestEvents.Action action,
            @Schema(description = "Null pour une action automatique de la plateforme") AuthorSummary actor,
            Long participationId,
            String note,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "AdminPlaytestSummary", description = "Campagne dans le back office, avec ses signaux d'alerte")
    public record AdminPlaytestSummary(
            @Schema(requiredMode = REQUIRED) PlaytestSummary campaign,
            @Schema(requiredMode = REQUIRED) boolean hidden,
            @Schema(requiredMode = REQUIRED, description = "Active, aucune participation depuis 7 jours")
            boolean inactive,
            @Schema(requiredMode = REQUIRED, description = "Plus de 30 % des testeurs en cours « à confirmer »")
            boolean stalled,
            String reviewNote) {
    }

    @Schema(name = "PlaytestStats", description = "Indicateurs du back office, calculés à la demande")
    public record Stats(
            @Schema(requiredMode = REQUIRED) long campaigns,
            @Schema(requiredMode = REQUIRED) long pendingReview,
            @Schema(requiredMode = REQUIRED) long active,
            @Schema(requiredMode = REQUIRED) long completed,
            @Schema(requiredMode = REQUIRED, description = "Campagnes dont toutes les places ont été tenues jusqu'au bout")
            long targetReached,
            @Schema(requiredMode = REQUIRED) long owners,
            @Schema(requiredMode = REQUIRED) long testers,
            @Schema(requiredMode = REQUIRED) long participationsRunning,
            @Schema(requiredMode = REQUIRED) long participationsCompleted) {
    }

    public enum Availability {
        /** Au moins une place libre. */
        OPEN,
        /** Plus aucune place. */
        FULL
    }

    public enum Problem {
        /** Active, aucune participation depuis 7 jours. */
        INACTIVE,
        /** Plus de 30 % des testeurs en cours « à confirmer ». */
        STALLED,
        /** Masquée par la modération. */
        REPORTED
    }
}
