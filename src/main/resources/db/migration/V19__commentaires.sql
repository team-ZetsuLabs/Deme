-- QA-9 : commentaires courts sous une question ou sous une réponse (demande de précision, remerciement…).
-- Un commentaire vise soit une question, soit une réponse, jamais les deux.

create table comments (
    id            bigserial primary key,
    question_id   bigint      references questions (id) on delete cascade,
    answer_id     bigint      references answers (id) on delete cascade,
    author_id     bigint      not null references users (id),
    body_markdown text        not null,
    body_html     text        not null,
    created_at    timestamptz not null default now(),
    constraint comments_one_target check ((question_id is null) <> (answer_id is null))
);
create index comments_question_idx on comments (question_id, created_at) where question_id is not null;
create index comments_answer_idx on comments (answer_id, created_at) where answer_id is not null;
