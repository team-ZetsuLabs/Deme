-- Photos de profil des membres de démo (SET-1), servies par Cloudinary : la version de photos.sql pour un serveur
-- dont le disque ne dure pas. Il faut d'abord envoyer les images avec seed/avatars-cloudinary.sh.
-- Variables : demo_username, cloud_name, folder (le même que CLOUDINARY_FOLDER, zetsu par défaut).
-- Rejouable. Remplace seulement un profil sans photo ou qui pointe encore vers l'avatar de démo posé sur le disque
-- par photos.sql : une photo mise par le membre, ou venue de GitHub ou Google, n'est jamais touchée.
-- L'adresse a la même forme que celles produites par le back-end (recadrage 256 px, format automatique) : si le
-- membre change de photo, l'avatar de démo est retiré de Cloudinary comme n'importe quelle ancienne photo.

\set ON_ERROR_STOP on

begin;

update users u
set avatar_url = 'https://res.cloudinary.com/' || :'cloud_name' || '/image/upload/c_fill,w_256,h_256/f_auto,q_auto/v1/'
                 || :'folder' || '/avatars/' || p.file
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
where u.username = p.username
  and (u.avatar_url is null or u.avatar_url = '/api/v1/users/' || u.username || '/avatar/' || p.file);

commit;
