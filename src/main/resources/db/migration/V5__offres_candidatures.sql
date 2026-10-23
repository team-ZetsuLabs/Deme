-- JOB-1 à JOB-4 : offres validées par l'équipe avant publication. JOB-3, JOB-7 : candidatures.

create table jobs (
    id                   bigserial primary key,
    recruiter_id         bigint       not null references users (id),
    title                varchar(120) not null,
    company_name         varchar(80)  not null,
    company_website      varchar(200),
    type                 varchar(20)  not null check (type in ('PERMANENT', 'REMOTE', 'CONTRACT', 'INTERNSHIP')),
    country_code         varchar(2),
    city                 varchar(80),
    description_markdown text         not null,
    description_html     text         not null,
    compensation         varchar(120),
    status               varchar(20)  not null default 'PENDING'
        check (status in ('PENDING', 'PUBLISHED', 'REJECTED', 'CLOSED')),
    rejection_reason     varchar(500),
    reviewed_by          bigint       references users (id),
    reviewed_at          timestamptz,
    created_at           timestamptz  not null default now(),
    updated_at           timestamptz  not null default now()
);
create index jobs_published_idx on jobs (created_at desc, id desc) where status = 'PUBLISHED';
create index jobs_pending_idx on jobs (created_at, id) where status = 'PENDING';
create index jobs_recruiter_idx on jobs (recruiter_id, created_at desc);

-- Mêmes étiquettes que les questions et la stack des membres, pour la correspondance (JOB-2).
create table job_technologies (
    job_id   bigint  not null references jobs (id) on delete cascade,
    tag_id   bigint  not null references tags (id),
    position integer not null,
    primary key (job_id, tag_id)
);
create index job_technologies_tag_idx on job_technologies (tag_id);

-- Une candidature vise une offre ou une mission (JOB-5) ; la clé étrangère vers les missions arrive avec leur table.
create table applications (
    id                bigserial primary key,
    candidate_id      bigint        not null references users (id) on delete cascade,
    job_id            bigint        references jobs (id) on delete cascade,
    mission_id        bigint,
    message           varchar(2000) not null,
    cv_file           varchar(60),
    proposed_amount   bigint,
    proposed_currency varchar(3),
    status            varchar(20)   not null default 'SENT'
        check (status in ('SENT', 'VIEWED', 'SHORTLISTED', 'REJECTED')),
    created_at        timestamptz   not null default now(),
    updated_at        timestamptz   not null default now(),
    constraint applications_target_check check ((job_id is null) <> (mission_id is null))
);
create unique index applications_job_candidate_key on applications (job_id, candidate_id) where job_id is not null;
create unique index applications_mission_candidate_key on applications (mission_id, candidate_id) where mission_id is not null;
create index applications_candidate_idx on applications (candidate_id, created_at desc);
