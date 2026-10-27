-- Photos de profil des membres de démo (SET-1) : des avatars dessinés, aucune photo de vraie personne.
-- Les images sont dans seed/avatars/ ; il faut d'abord les copier dans UPLOADS_DIR/avatars (voir seed/README.md),
-- sinon le profil pointe vers une image que le serveur ne trouve pas.
-- Rejouable, et ne remplace jamais une photo déjà mise par le membre ou venue de GitHub ou Google.

\set ON_ERROR_STOP on

begin;

update users u
set avatar_url = '/api/v1/users/' || u.username || '/avatar/' || p.file
from (values (:'demo_username', 'd5d75ee1-0550-5f0a-a590-fbb182e1a12f.webp'),
             ('moussa_s', 'fc014402-eae3-5eb6-ab1a-63d36544c556.webp'),
             ('wanjiru_k', '26139fef-97c9-59eb-8444-9d847c8b556d.webp'),
             ('chinedu_o', '22845175-bb0e-5fa5-a6da-28e97ef7ef04.webp'),
             ('kouassi_y', '99a852e9-e05d-5150-adaa-67620ab018fd.webp'),
             ('fatou_n', '3964a006-c71d-5051-a9dd-973ee07cde31.webp'),
             ('awa_k', '593080f6-b3f9-519d-b9ba-4892c4650641.webp'),
             ('kwame_a', 'b7a72d87-4c65-5fb6-9a8a-ecbc368d5e4e.webp'),
             ('amina_h', '35bacacd-0cec-5ec1-a7be-a7ef6d68f269.webp'))
         as p(username, file)
where u.username = p.username and u.avatar_url is null;

commit;
