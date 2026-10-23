-- AUTH-5 : parcours d'accueil (stack, pays, langue). SET-1 : technologies du profil.

alter table users add column onboarded_at timestamptz;

-- Les technologies partagent la table des étiquettes, pour rapprocher la stack d'un membre des offres (JOB-2).
create table user_technologies (
    user_id  bigint   not null references users (id) on delete cascade,
    tag_id   bigint   not null references tags (id),
    position integer  not null,
    primary key (user_id, tag_id)
);
create index user_technologies_tag_idx on user_technologies (tag_id);
