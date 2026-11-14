-- Sprint 1 : membres, comptes OAuth, questions, réponses, étiquettes, votes, réputation.

create table users (
    id            bigserial primary key,
    username      varchar(30)  not null,
    email         varchar(254),
    password_hash varchar(100),
    display_name  varchar(80)  not null,
    avatar_url    varchar(500),
    bio           varchar(1000),
    country_code  varchar(2),
    city          varchar(80),
    role          varchar(20)  not null default 'MEMBER' check (role in ('MEMBER', 'REFERENT', 'ADMIN')),
    reputation    integer      not null default 0,
    created_at    timestamptz  not null default now(),
    constraint users_username_key unique (username),
    constraint users_email_key unique (email)
);
create unique index users_username_lower_idx on users (lower(username));
create unique index users_email_lower_idx on users (lower(email));

create table oauth_accounts (
    id               bigserial primary key,
    user_id          bigint       not null references users (id) on delete cascade,
    provider         varchar(20)  not null,
    provider_user_id varchar(100) not null,
    created_at       timestamptz  not null default now(),
    constraint oauth_accounts_provider_key unique (provider, provider_user_id)
);
create index oauth_accounts_user_idx on oauth_accounts (user_id);

create table tags (
    id   bigserial primary key,
    name varchar(30) not null,
    constraint tags_name_key unique (name)
);

create table questions (
    id                    bigserial primary key,
    author_id             bigint       not null references users (id),
    title                 varchar(150) not null,
    body_markdown         text         not null,
    body_html             text         not null,
    country_code          varchar(2),
    mobile_money_operator varchar(20),
    network_quality       varchar(20),
    score                 integer      not null default 0,
    answer_count          integer      not null default 0,
    accepted_answer_id    bigint,
    created_at            timestamptz  not null default now(),
    updated_at            timestamptz  not null default now(),
    -- Recherche plein texte en français et en anglais : le titre pèse plus que le corps.
    search_vector tsvector generated always as (
        setweight(to_tsvector('french', title), 'A') ||
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('french', body_markdown), 'B') ||
        setweight(to_tsvector('english', body_markdown), 'B')
    ) stored
);
create index questions_search_idx on questions using gin (search_vector);
create index questions_created_idx on questions (created_at desc, id desc);
create index questions_score_idx on questions (score desc, created_at desc);
create index questions_author_idx on questions (author_id);
create index questions_country_idx on questions (country_code);

create table question_tags (
    question_id bigint not null references questions (id) on delete cascade,
    tag_id      bigint not null references tags (id),
    primary key (question_id, tag_id)
);
create index question_tags_tag_idx on question_tags (tag_id);

create table answers (
    id            bigserial primary key,
    question_id   bigint      not null references questions (id) on delete cascade,
    author_id     bigint      not null references users (id),
    body_markdown text        not null,
    body_html     text        not null,
    score         integer     not null default 0,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index answers_question_idx on answers (question_id, score desc);
create index answers_author_idx on answers (author_id);

alter table questions
    add constraint questions_accepted_answer_fk
        foreign key (accepted_answer_id) references answers (id) on delete set null;

create table votes (
    id          bigserial primary key,
    voter_id    bigint      not null references users (id) on delete cascade,
    target_type varchar(10) not null check (target_type in ('QUESTION', 'ANSWER')),
    target_id   bigint      not null,
    value       smallint    not null check (value in (-1, 1)),
    created_at  timestamptz not null default now(),
    constraint votes_unique_per_member unique (voter_id, target_type, target_id)
);
create index votes_target_idx on votes (target_type, target_id);

create table reputation_events (
    id          bigserial primary key,
    user_id     bigint      not null references users (id) on delete cascade,
    delta       integer     not null,
    reason      varchar(30) not null,
    question_id bigint,
    answer_id   bigint,
    created_at  timestamptz not null default now()
);
create index reputation_events_user_idx on reputation_events (user_id, created_at desc);
