-- Alignement sur le cahier des charges : AUTH-1, AUTH-2, QA-1, QA-2, QA-6, QA-7, REP-1 à REP-3, SET-1.

-- Rôles du cahier (section 3). Référent devient un niveau calculé depuis la réputation, plus un rôle.
alter table users drop constraint users_role_check;
update users set role = 'MEMBER' where role = 'REFERENT';
alter table users add constraint users_role_check check (role in ('MEMBER', 'RECRUITER', 'MODERATOR', 'ADMIN'));

alter table users
    add column email_verified        boolean     not null default false,
    add column status                varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
    add column language              varchar(2)  not null default 'fr' check (language in ('fr', 'en')),
    add column visible_to_recruiters boolean     not null default false;

-- Un email venu de GitHub ou Google a été vérifié par le fournisseur.
update users u set email_verified = true
where u.email is not null and exists (select 1 from oauth_accounts a where a.user_id = u.id);

-- SET-1 : présentation de 200 caractères.
update users set bio = left(bio, 200) where length(bio) > 200;
alter table users alter column bio type varchar(200);

-- QA-2 : listes du cahier.
update questions set network_quality = case network_quality
    when 'MOBILE_2G' then 'VERY_POOR'
    when 'MOBILE_3G' then 'UNSTABLE'
    when 'UNSTABLE' then 'UNSTABLE'
    else 'GOOD' end
where network_quality is not null;
update questions set mobile_money_operator = 'OTHER' where mobile_money_operator in ('AIRTEL_MONEY', 'FREE_MONEY');
alter table questions
    add constraint questions_network_check check (network_quality in ('GOOD', 'UNSTABLE', 'VERY_POOR')),
    add constraint questions_operator_check
        check (mobile_money_operator in ('ORANGE_MONEY', 'WAVE', 'MOOV_MONEY', 'MTN_MOMO', 'MPESA', 'OTHER'));

-- QA-1 et QA-3 : code facultatif stocké en texte brut, coloré côté client. QA-2 : version de la techno.
alter table questions
    add column code         text,
    add column tech_version varchar(60),
    add column tags_text    varchar(200) not null default '';
alter table answers add column code text;

-- QA-7 : la recherche porte aussi sur les étiquettes (copiées dans tags_text par l'application).
update questions q set tags_text = coalesce(
    (select string_agg(t.name, ' ' order by t.name)
     from question_tags qt join tags t on t.id = qt.tag_id
     where qt.question_id = q.id), '');
drop index questions_search_idx;
alter table questions drop column search_vector;
alter table questions add column search_vector tsvector generated always as (
    setweight(to_tsvector('french', title), 'A') ||
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('french', tags_text), 'A') ||
    setweight(to_tsvector('english', tags_text), 'A') ||
    setweight(to_tsvector('french', body_markdown), 'B') ||
    setweight(to_tsvector('english', body_markdown), 'B')
) stored;
create index questions_search_idx on questions using gin (search_vector);

-- QA-6 : filtre « Sans solution ».
create index questions_unsolved_idx on questions (created_at desc, id desc) where accepted_answer_id is null;

-- REP-3 : on retient qui a provoqué le gain, pour plafonner les votes entre deux mêmes comptes.
alter table reputation_events add column source_user_id bigint references users (id) on delete set null;
create index reputation_events_pair_idx on reputation_events (source_user_id, user_id, created_at);

-- Section 8 : un vote négatif ne coûte plus de points. Aucune donnée en production à ce stade.
delete from reputation_events where reason in ('QUESTION_DOWNVOTED', 'ANSWER_DOWNVOTED');
update users u set reputation = coalesce((select sum(e.delta) from reputation_events e where e.user_id = u.id), 0);
