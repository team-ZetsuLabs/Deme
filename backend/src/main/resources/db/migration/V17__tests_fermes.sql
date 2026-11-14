-- Tests fermés Google Play (TST-1 à TST-6, docs/conception-tests-fermes.md). Un porteur réunit des testeurs pour les
-- 14 jours de test fermé exigés par Google ; Zetsu organise l'entraide mais ne peut rien vérifier chez Google.
-- Numérotée 17 : V16 est la suppression des questions (QA-3).

create table test_campaigns (
    id                   bigserial primary key,
    owner_id             bigint        not null references users (id),
    platform             varchar(20)   not null default 'GOOGLE_PLAY' check (platform in ('GOOGLE_PLAY')),
    app_name             varchar(80)   not null,
    package_name         varchar(150)  not null,
    description_markdown text          not null,
    description_html     text          not null,
    icon_url             varchar(300),
    -- Lien d'inscription au test : https://play.google.com/apps/testing/… ou https://groups.google.com/…
    opt_in_url           varchar(300)  not null,
    testers_target       integer       not null default 14 check (testers_target between 12 and 100),
    required_days        integer       not null default 14 check (required_days between 1 and 60),
    desired_start        date,
    instructions         varchar(2000),
    status               varchar(20)   not null default 'DRAFT'
        check (status in ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'ACTIVE', 'SUSPENDED', 'COMPLETED')),
    review_note          varchar(300),
    reviewed_by          bigint        references users (id) on delete set null,
    reviewed_at          timestamptz,
    started_at           timestamptz,
    completed_at         timestamptz,
    hidden               boolean       not null default false,
    created_at           timestamptz   not null default now(),
    updated_at           timestamptz   not null default now()
);
create index test_campaigns_status_idx on test_campaigns (status, created_at desc, id desc);
create index test_campaigns_owner_idx on test_campaigns (owner_id, created_at desc);
-- Une seule campagne en cours (en validation, active ou suspendue) par application.
create unique index test_campaigns_one_running_idx on test_campaigns (lower(package_name))
    where status in ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');

create table test_participations (
    id               bigserial primary key,
    campaign_id      bigint       not null references test_campaigns (id) on delete cascade,
    tester_id        bigint       not null references users (id),
    -- Facultative, visible du porteur et de l'équipe seulement, effacée 30 jours après la fin.
    google_email     varchar(254),
    status           varchar(20)  not null default 'JOINED'
        check (status in ('JOINED', 'CONFIRMED', 'VERIFIED', 'COMPLETED', 'DROPPED', 'REMOVED')),
    joined_at        timestamptz  not null default now(),
    -- Début du décompte des jours.
    confirmed_at     timestamptz,
    verified_at      timestamptz,
    verified_by      bigint       references users (id) on delete set null,
    ends_at          timestamptz,
    last_check_in_at timestamptz,
    completed_at     timestamptz,
    dropped_at       timestamptz,
    drop_reason      varchar(300),
    replaces_id      bigint       references test_participations (id) on delete set null,
    -- Rappels envoyés, pour ne jamais envoyer deux fois le même.
    install_reminded boolean      not null default false,
    stay_reminded_at timestamptz,
    ending_notified  boolean      not null default false,
    -- Un membre ne rejoint jamais deux fois la même campagne, même après un abandon.
    constraint test_participations_once unique (campaign_id, tester_id)
);
create index test_participations_tester_idx on test_participations (tester_id, joined_at desc);
create index test_participations_campaign_idx on test_participations (campaign_id, status);
create index test_participations_running_idx on test_participations (status, ends_at)
    where status in ('JOINED', 'CONFIRMED', 'VERIFIED');

-- « Toujours inscrit » : une ligne par jour et par participation. Sert à repérer les décrochages, pas de preuve.
create table test_check_ins (
    participation_id bigint not null references test_participations (id) on delete cascade,
    day              date   not null,
    primary key (participation_id, day)
);

-- Historique de chaque campagne, lu par le back office.
create table test_campaign_events (
    id               bigserial primary key,
    campaign_id      bigint       not null references test_campaigns (id) on delete cascade,
    participation_id bigint       references test_participations (id) on delete set null,
    actor_id         bigint       references users (id) on delete set null,
    action           varchar(30)  not null,
    note             varchar(300),
    created_at       timestamptz  not null default now()
);
create index test_campaign_events_campaign_idx on test_campaign_events (campaign_id, created_at desc, id desc);

-- +5 de réputation par participation terminée, une seule fois.
alter table reputation_events add column test_participation_id bigint
    references test_participations (id) on delete set null;

-- MOD-1 : une campagne se signale et se masque comme tout contenu.
alter table moderation_cases drop constraint moderation_cases_target_type_check;
alter table moderation_cases add constraint moderation_cases_target_type_check
    check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'USER', 'PROJECT', 'PLAYTEST'));

alter table notifications drop constraint notifications_target_type_check;
alter table notifications add constraint notifications_target_type_check
    check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'APPLICATION', 'CHALLENGE', 'PROJECT', 'USER',
                           'COMMUNITY_PROPOSAL', 'PLAYTEST'));

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in ('ANSWER_POSTED', 'ANSWER_ACCEPTED',
    'VOTE_RECEIVED', 'JOB_MATCH', 'MISSION_MATCH', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'JOB_REVIEWED',
    'CHALLENGE_STARTED', 'PROJECT_REQUEST_DECIDED', 'CONTENT_HIDDEN', 'CONTENT_RESTORED', 'ACCOUNT_WARNED',
    'SUBMISSION_REVIEWED', 'COMMUNITY_PROPOSAL_DECISION', 'PROJECT_REQUEST_RECEIVED', 'PROJECT_MEMBER_REMOVED',
    'PROJECT_CLOSED', 'PLAYTEST_NEW_CAMPAIGN', 'PLAYTEST_JOINED', 'PLAYTEST_INSTALL_REMINDER',
    'PLAYTEST_STAY_REMINDER', 'PLAYTEST_ENDING_SOON', 'PLAYTEST_PARTICIPATION_DONE', 'PLAYTEST_TESTER_LEFT',
    'PLAYTEST_TESTER_REPLACED', 'PLAYTEST_CAMPAIGN_FULL', 'PLAYTEST_CAMPAIGN_REVIEWED', 'PLAYTEST_REMOVED'));
