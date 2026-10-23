package dev.zetsu.job;

/** JOB-4 : une offre reste « En attente » jusqu'à la validation par l'équipe. */
public enum JobStatus {
    PENDING,
    PUBLISHED,
    REJECTED,
    CLOSED
}
