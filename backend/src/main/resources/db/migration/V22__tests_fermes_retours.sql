-- Tests fermés : retours des testeurs au porteur (bug, suggestion, autre), avec une note facultative de 1 à 5.
-- Lus seulement par le porteur et l'équipe.

create table test_feedback (
    id            bigserial primary key,
    campaign_id   bigint      not null references test_campaigns (id) on delete cascade,
    author_id     bigint      not null references users (id),
    kind          varchar(20) not null default 'OTHER' check (kind in ('BUG', 'SUGGESTION', 'OTHER')),
    rating        integer     check (rating between 1 and 5),
    body_markdown text        not null,
    body_html     text        not null,
    created_at    timestamptz not null default now()
);
create index test_feedback_campaign_idx on test_feedback (campaign_id, created_at desc, id desc);

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in ('ANSWER_POSTED', 'ANSWER_ACCEPTED',
    'VOTE_RECEIVED', 'JOB_MATCH', 'MISSION_MATCH', 'APPLICATION_RECEIVED', 'APPLICATION_DECIDED', 'JOB_REVIEWED',
    'CHALLENGE_STARTED', 'PROJECT_REQUEST_DECIDED', 'CONTENT_HIDDEN', 'CONTENT_RESTORED', 'ACCOUNT_WARNED',
    'SUBMISSION_REVIEWED', 'COMMUNITY_PROPOSAL_DECISION', 'PROJECT_REQUEST_RECEIVED', 'PROJECT_MEMBER_REMOVED',
    'PROJECT_CLOSED', 'PLAYTEST_NEW_CAMPAIGN', 'PLAYTEST_JOINED', 'PLAYTEST_INSTALL_REMINDER',
    'PLAYTEST_STAY_REMINDER', 'PLAYTEST_ENDING_SOON', 'PLAYTEST_PARTICIPATION_DONE', 'PLAYTEST_TESTER_LEFT',
    'PLAYTEST_TESTER_REPLACED', 'PLAYTEST_CAMPAIGN_FULL', 'PLAYTEST_CAMPAIGN_REVIEWED', 'PLAYTEST_REMOVED',
    'PLAYTEST_FEEDBACK'));
