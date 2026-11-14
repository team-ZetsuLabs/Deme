-- CH-1 à CH-3 : défis créés par l'équipe, un dépôt GitHub par membre et par défi, notation sur 100.

create table challenges (
    id                      bigserial primary key,
    title                   varchar(120) not null,
    statement_markdown      text         not null,
    statement_html          text         not null,
    specifications_markdown text         not null,
    specifications_html     text         not null,
    starts_at               timestamptz  not null,
    ends_at                 timestamptz  not null,
    created_by              bigint       references users (id),
    -- Vrai une fois les membres notifiés du début du défi (CHALLENGE_STARTED).
    start_notified          boolean      not null default false,
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now(),
    check (ends_at > starts_at)
);
create index challenges_period_idx on challenges (starts_at, ends_at);

create table challenge_technologies (
    challenge_id bigint  not null references challenges (id) on delete cascade,
    tag_id       bigint  not null references tags (id),
    position     integer not null,
    primary key (challenge_id, tag_id)
);
create index challenge_technologies_tag_idx on challenge_technologies (tag_id);

create table submissions (
    id             bigserial primary key,
    challenge_id   bigint        not null references challenges (id) on delete cascade,
    member_id      bigint        not null references users (id),
    repository_url varchar(200)  not null,
    comment        varchar(500),
    status         varchar(20)   not null default 'PENDING' check (status in ('PENDING', 'VALIDATED', 'REJECTED')),
    score          integer       check (score between 0 and 100),
    feedback       varchar(1000),
    reviewed_by    bigint        references users (id),
    submitted_at   timestamptz   not null default now(),
    reviewed_at    timestamptz,
    unique (challenge_id, member_id)
);
create index submissions_leaderboard_idx on submissions (challenge_id, score desc, submitted_at)
    where status = 'VALIDATED';

-- Les +20 d'un dépôt validé (CHALLENGE_VALIDATED) sont rattachés au dépôt, pour être retirés une seule fois.
alter table reputation_events add column submission_id bigint references submissions (id) on delete set null;
