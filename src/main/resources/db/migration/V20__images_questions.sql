-- QA-11 : jusqu'à 2 images par question (capture d'une erreur, d'un écran). L'image est envoyée d'abord, puis
-- rattachée à la question à la publication ; celles jamais rattachées sont effacées au bout d'un jour.

create table question_images (
    id          varchar(36)  primary key,
    uploader_id bigint       not null references users (id) on delete cascade,
    question_id bigint       references questions (id) on delete cascade,
    -- Référence de stockage : nom du fichier sur le disque ou « cloudinary:<public_id> ».
    storage_ref varchar(300) not null,
    url         varchar(500) not null,
    position    integer      not null default 0,
    created_at  timestamptz  not null default now()
);
create index question_images_question_idx on question_images (question_id, position) where question_id is not null;
create index question_images_orphans_idx on question_images (created_at) where question_id is null;
