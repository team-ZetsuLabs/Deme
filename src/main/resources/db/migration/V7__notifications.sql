-- NOT-1 : notifications dans l'application. Le titre de la cible est copié pour lister sans jointure.

create table notifications (
    id           bigserial primary key,
    recipient_id bigint       not null references users (id) on delete cascade,
    type         varchar(30)  not null check (type in ('ANSWER_POSTED', 'ANSWER_ACCEPTED', 'VOTE_RECEIVED', 'JOB_MATCH',
        'MISSION_MATCH', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'JOB_REVIEWED', 'CHALLENGE_STARTED',
        'PROJECT_REQUEST_DECIDED')),
    actor_id     bigint       references users (id) on delete set null,
    target_type  varchar(20)  not null
        check (target_type in ('QUESTION', 'ANSWER', 'JOB', 'MISSION', 'APPLICATION', 'CHALLENGE', 'PROJECT')),
    target_id    bigint       not null,
    target_title varchar(150) not null,
    question_id  bigint,
    outcome      varchar(20),
    read         boolean      not null default false,
    created_at   timestamptz  not null default now()
);
create index notifications_recipient_idx on notifications (recipient_id, created_at desc, id desc);
create index notifications_unread_idx on notifications (recipient_id) where not read;
