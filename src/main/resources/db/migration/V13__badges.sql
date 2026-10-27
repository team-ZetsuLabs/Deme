-- Badges (REP-4). Les critères sont dans le code (Badge, BadgeService) et les seuils dans la configuration.
-- Un badge gagné ne se perd pas.
create table user_badges (
    user_id    bigint      not null references users (id) on delete cascade,
    badge      varchar(30) not null
        check (badge in ('FIRST_STEP', 'HELPER', 'SOLVER', 'CHALLENGER', 'POLYGLOT', 'LOCAL_HELP')),
    awarded_at timestamptz not null default now(),
    primary key (user_id, badge)
);
