-- MOD-1 à MOD-3 : signalements regroupés en un dossier par contenu, masquage, décision, contestation.

create table moderation_cases (
    id                bigserial primary key,
    target_type       varchar(20)   not null check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'USER')),
    target_id         bigint        not null,
    -- Auteur du contenu (le membre lui-même pour un profil) : pour « mes contenus masqués » et l'auto-modération.
    target_author_id  bigint        not null references users (id),
    status            varchar(20)   not null default 'OPEN'
        check (status in ('OPEN', 'DISMISSED', 'HIDDEN', 'APPEALED', 'RESTORED')),
    report_count      int           not null default 0,
    decision_action   varchar(20)   check (decision_action in ('DISMISS', 'HIDE', 'RESTORE', 'WARN', 'SUSPEND')),
    decision_note     varchar(500),
    decided_by        bigint        references users (id),
    decided_by_team   boolean,
    decided_at        timestamptz,
    appeal            varchar(1000),
    appealed_at       timestamptz,
    first_reported_at timestamptz   not null default now(),
    updated_at        timestamptz   not null default now(),
    unique (target_type, target_id)
);
create index moderation_cases_queue_idx on moderation_cases (report_count desc, first_reported_at)
    where decided_at is null and status in ('OPEN', 'HIDDEN');
create index moderation_cases_author_idx on moderation_cases (target_author_id, updated_at desc);

-- Un signalement par membre et par contenu : le compteur du dossier compte donc des comptes distincts (MOD-2).
create table reports (
    id          bigserial primary key,
    case_id     bigint       not null references moderation_cases (id) on delete cascade,
    reporter_id bigint       not null references users (id),
    reason      varchar(20)  not null
        check (reason in ('SPAM', 'OFFENSIVE', 'OFF_TOPIC', 'IMPERSONATION', 'FRAUDULENT_JOB')),
    comment     varchar(500),
    created_at  timestamptz  not null default now(),
    unique (case_id, reporter_id)
);

-- Contenu masqué : invisible pour tous sauf son auteur et l'équipe.
alter table questions add column hidden boolean not null default false;
alter table answers add column hidden boolean not null default false;
alter table jobs add column hidden boolean not null default false;
alter table missions add column hidden boolean not null default false;
alter table users add column hidden boolean not null default false;

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in ('ANSWER_POSTED', 'ANSWER_ACCEPTED',
    'VOTE_RECEIVED', 'JOB_MATCH', 'MISSION_MATCH', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'JOB_REVIEWED',
    'CHALLENGE_STARTED', 'PROJECT_REQUEST_DECIDED', 'CONTENT_HIDDEN', 'CONTENT_RESTORED', 'ACCOUNT_WARNED',
    'SUBMISSION_REVIEWED'));
alter table notifications drop constraint notifications_target_type_check;
alter table notifications add constraint notifications_target_type_check
    check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'APPLICATION', 'CHALLENGE', 'PROJECT', 'USER'));
