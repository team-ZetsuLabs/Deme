package dev.zetsu.project;

/** Cycle de vie d'un projet (section 5.3). Le porteur décide de chaque étape, sauf la mise en pause. */
public enum ProjectStatus {
    /** Au moins un rôle ouvert : le projet recrute. */
    OPEN,
    /** Tous les rôles sont pourvus : l'équipe travaille. */
    IN_PROGRESS,
    /** 60 jours sans activité ; la prochaine action de l'équipe le relance. */
    PAUSED,
    /** Clôturé par le porteur : définitif (PRJ-6). */
    CLOSED
}
