-- JOB-5 : missions courtes entre pairs, avec budget indicatif et délai. Les propositions sont des applications.

create table missions (
    id                   bigserial primary key,
    author_id            bigint       not null references users (id),
    title                varchar(120) not null,
    description_markdown text         not null,
    description_html     text         not null,
    kind                 varchar(20)  not null
        check (kind in ('TROUBLESHOOTING', 'INTEGRATION', 'CODE_REVIEW', 'OTHER')),
    budget_amount        bigint       not null check (budget_amount >= 0),
    budget_currency      varchar(3)   not null,
    duration_days        integer      not null check (duration_days between 1 and 90),
    country_code         varchar(2),
    status               varchar(20)  not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    created_at           timestamptz  not null default now(),
    updated_at           timestamptz  not null default now()
);
create index missions_status_idx on missions (status, created_at desc, id desc);
create index missions_author_idx on missions (author_id, created_at desc);

create table mission_technologies (
    mission_id bigint  not null references missions (id) on delete cascade,
    tag_id     bigint  not null references tags (id),
    position   integer not null,
    primary key (mission_id, tag_id)
);
create index mission_technologies_tag_idx on mission_technologies (tag_id);

alter table applications
    add constraint applications_mission_fkey foreign key (mission_id) references missions (id) on delete cascade;
