-- COM-1 et COM-2 (idée de l'équipe, hors cahier) : communautés par pays ou par technologie, que l'on rejoint
-- d'un clic. L'équipe les crée ; les Référents en proposent, l'équipe valide ou refuse avec un motif.

create table communities (
    id           bigserial primary key,
    -- Adresse /communities/{slug}, fixée à la création : un changement de nom ne casse pas les liens.
    slug         varchar(40)  not null unique,
    name         varchar(40)  not null,
    kind         varchar(10)  not null check (kind in ('COUNTRY', 'TECH')),
    country_code varchar(2),
    tag_id       bigint       references tags (id),
    description  varchar(200) not null,
    rules        text[]       not null default '{}',
    status       varchar(10)  not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
    created_by   bigint       references users (id),
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now(),
    -- Une communauté de pays a un pays et pas d'étiquette, une communauté de techno l'inverse.
    check ((kind = 'COUNTRY' and country_code is not null and tag_id is null)
        or (kind = 'TECH' and tag_id is not null and country_code is null))
);
create unique index communities_name_idx on communities (lower(name));
create unique index communities_country_idx on communities (country_code) where kind = 'COUNTRY';
create unique index communities_tag_idx on communities (tag_id) where kind = 'TECH';

create table community_members (
    community_id bigint      not null references communities (id) on delete cascade,
    user_id      bigint      not null references users (id) on delete cascade,
    joined_at    timestamptz not null default now(),
    primary key (community_id, user_id)
);
create index community_members_user_idx on community_members (user_id);

-- Référents nommés par l'équipe pour veiller sur une communauté, dans l'ordre choisi.
create table community_referents (
    community_id bigint  not null references communities (id) on delete cascade,
    user_id      bigint  not null references users (id) on delete cascade,
    position     integer not null,
    primary key (community_id, user_id)
);

create table community_proposals (
    id               bigserial primary key,
    proposer_id      bigint       not null references users (id) on delete cascade,
    name             varchar(40)  not null,
    kind             varchar(10)  not null check (kind in ('COUNTRY', 'TECH')),
    country_code     varchar(2),
    -- Nom de l'étiquette : elle n'est créée qu'à l'acceptation.
    tag_name         varchar(30),
    description      varchar(200) not null,
    rules            text[]       not null default '{}',
    status           varchar(10)  not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason varchar(500),
    community_id     bigint       references communities (id) on delete set null,
    reviewed_by      bigint       references users (id),
    reviewed_at      timestamptz,
    created_at       timestamptz  not null default now()
);
create index community_proposals_queue_idx on community_proposals (created_at, id) where status = 'PENDING';
create index community_proposals_proposer_idx on community_proposals (proposer_id, created_at desc);

-- Membres les plus utiles du mois : points gagnés sur les questions d'une communauté.
create index reputation_events_recent_idx on reputation_events (created_at, question_id);

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in ('ANSWER_POSTED', 'ANSWER_ACCEPTED',
    'VOTE_RECEIVED', 'JOB_MATCH', 'MISSION_MATCH', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'JOB_REVIEWED',
    'CHALLENGE_STARTED', 'PROJECT_REQUEST_DECIDED', 'CONTENT_HIDDEN', 'CONTENT_RESTORED', 'ACCOUNT_WARNED',
    'SUBMISSION_REVIEWED', 'COMMUNITY_PROPOSAL_DECISION'));
alter table notifications drop constraint notifications_target_type_check;
alter table notifications add constraint notifications_target_type_check
    check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'APPLICATION', 'CHALLENGE', 'PROJECT', 'USER',
                           'COMMUNITY_PROPOSAL'));
