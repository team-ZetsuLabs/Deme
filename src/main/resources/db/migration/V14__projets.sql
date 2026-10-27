-- Espace Projets (PRJ-1 à PRJ-6, section 5). Un projet est une équipe dans la durée ; une mission (JOB-5) est un
-- service ponctuel. À appliquer après V12 (IA-1) et V13 (badges).

create table projects (
    id                   bigserial primary key,
    owner_id             bigint        not null references users (id),
    title                varchar(120)  not null,
    description_markdown text          not null,
    description_html     text          not null,
    type                 varchar(20)   not null check (type in ('OPEN_SOURCE', 'STUDY', 'STARTUP', 'VOLUNTEER')),
    github_url           varchar(200),
    contact_url          varchar(200),
    -- OPEN : au moins un rôle ouvert ; IN_PROGRESS : tous les rôles pourvus ; PAUSED : 60 jours sans activité.
    status               varchar(20)   not null default 'OPEN'
        check (status in ('OPEN', 'IN_PROGRESS', 'PAUSED', 'CLOSED')),
    hidden               boolean       not null default false,
    created_at           timestamptz   not null default now(),
    updated_at           timestamptz   not null default now(),
    last_activity_at     timestamptz   not null default now()
);
create index projects_status_idx on projects (status, created_at desc, id desc);
create index projects_owner_idx on projects (owner_id, created_at desc);
create index projects_activity_idx on projects (last_activity_at) where status in ('OPEN', 'IN_PROGRESS');

create table project_technologies (
    project_id bigint  not null references projects (id) on delete cascade,
    tag_id     bigint  not null references tags (id),
    position   integer not null,
    primary key (project_id, tag_id)
);
create index project_technologies_tag_idx on project_technologies (tag_id);

create table project_roles (
    id         bigserial primary key,
    project_id bigint      not null references projects (id) on delete cascade,
    title      varchar(80) not null,
    status     varchar(10) not null default 'OPEN' check (status in ('OPEN', 'FILLED')),
    created_at timestamptz not null default now()
);
create index project_roles_project_idx on project_roles (project_id, id);

create table project_role_technologies (
    role_id  bigint  not null references project_roles (id) on delete cascade,
    tag_id   bigint  not null references tags (id),
    position integer not null,
    primary key (role_id, tag_id)
);

-- Demandes et équipe : une ligne par demande, qui devient l'appartenance à l'équipe une fois acceptée.
create table project_members (
    id             bigserial primary key,
    project_id     bigint       not null references projects (id) on delete cascade,
    user_id        bigint       not null references users (id),
    -- Null si le rôle a été retiré par le porteur : la ligne reste pour l'historique.
    role_id        bigint       references project_roles (id) on delete set null,
    role_title     varchar(80)  not null,
    status         varchar(10)  not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REFUSED', 'LEFT')),
    message        varchar(500) not null,
    removal_reason varchar(300),
    created_at     timestamptz  not null default now(),
    decided_at     timestamptz,
    left_at        timestamptz
);
-- PRJ-3 : une seule demande en attente par membre et par projet.
create unique index project_members_one_pending_idx on project_members (project_id, user_id) where status = 'PENDING';
-- Un membre n'occupe qu'un rôle dans un projet, et un rôle n'a qu'un membre.
create unique index project_members_one_role_idx on project_members (project_id, user_id) where status = 'ACCEPTED';
create unique index project_members_role_filled_idx on project_members (role_id) where status = 'ACCEPTED';
create index project_members_user_idx on project_members (user_id, created_at desc);
create index project_members_project_idx on project_members (project_id, status, created_at desc);

-- PRJ-5 : fil de mises à jour, en texte brut.
create table project_updates (
    id         bigserial primary key,
    project_id bigint        not null references projects (id) on delete cascade,
    author_id  bigint        not null references users (id),
    text       varchar(1000) not null,
    created_at timestamptz   not null default now()
);
create index project_updates_project_idx on project_updates (project_id, created_at desc, id desc);

-- PRJ-6 : +10 par membre accepté à la clôture, une seule fois par projet.
alter table reputation_events add column project_id bigint references projects (id) on delete set null;

-- MOD-1 : un projet se signale et se masque comme tout contenu.
alter table moderation_cases drop constraint moderation_cases_target_type_check;
alter table moderation_cases add constraint moderation_cases_target_type_check
    check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'USER', 'PROJECT'));

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in ('ANSWER_POSTED', 'ANSWER_ACCEPTED',
    'VOTE_RECEIVED', 'JOB_MATCH', 'MISSION_MATCH', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'JOB_REVIEWED',
    'CHALLENGE_STARTED', 'PROJECT_REQUEST_DECIDED', 'CONTENT_HIDDEN', 'CONTENT_RESTORED', 'ACCOUNT_WARNED',
    'SUBMISSION_REVIEWED', 'COMMUNITY_PROPOSAL_DECISION', 'PROJECT_REQUEST_RECEIVED', 'PROJECT_MEMBER_REMOVED',
    'PROJECT_CLOSED'));
