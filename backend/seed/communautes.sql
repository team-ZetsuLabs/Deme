-- Données de démo des communautés (COM-1, COM-2). Rejouable à volonté : rien n'est créé deux fois.
-- Le compte Référent du jury n'a ni email ni mot de passe dans ce fichier : ils viennent des variables psql
-- demo_email et demo_password (voir seed/README.md).
--
-- Seuils du profil « demo » : Référent à 60 points. Les réputations ci-dessous dépassent aussi les seuils
-- normaux (1 500), pour que la démo marche avec ou sans ce profil.

\set ON_ERROR_STOP on

begin;

create extension if not exists pgcrypto;

-- Membres. Seul le compte du jury peut se connecter ; les autres n'ont pas de mot de passe.
insert into users (username, email, password_hash, display_name, country_code, city, bio, reputation,
                   email_verified, onboarded_at, language)
values (:'demo_username', lower(:'demo_email'), '{bcrypt}' || crypt(:'demo_password', gen_salt('bf', 10)),
        'Aminata Diallo', 'SN', 'Dakar',
        'Développeuse back-end chez une fintech de Dakar. Wave, Orange Money et Spring Boot au quotidien.',
        1642, true, now(), 'fr')
on conflict do nothing;

insert into users (username, display_name, country_code, city, bio, reputation, email_verified, onboarded_at)
values ('moussa_s', 'Moussa Sow', 'SN', 'Thiès', 'Mobile Flutter et Firebase, freelance pour des PME sénégalaises.', 1580, true, now()),
       ('wanjiru_k', 'Wanjiru Kamau', 'KE', 'Nairobi', 'Intégrations M-Pesa Daraja et API Django.', 1710, true, now()),
       ('chinedu_o', 'Chinedu Okafor', 'NG', 'Lagos', 'React Native et Node.js, applications de transfert d''argent.', 1520, true, now()),
       ('kouassi_y', 'Yao Kouassi', 'CI', 'Abidjan', 'Laravel et Vue, sites marchands qui acceptent Orange Money.', 640, true, now()),
       ('fatou_n', 'Fatou Ndiaye', 'SN', 'Saint-Louis', 'Étudiante en génie logiciel, Flutter et Kotlin.', 612, true, now()),
       ('awa_k', 'Awa Kane', 'SN', 'Dakar', 'Back-end Java, réconciliation des paiements mobiles.', 875, true, now()),
       ('kwame_a', 'Kwame Asante', 'GH', 'Accra', 'MTN MoMo et Spring Boot pour une startup d''Accra.', 455, true, now()),
       ('amina_h', 'Amina Hassan', 'KE', 'Mombasa', 'Flutter et applications hors ligne pour les agents de terrain.', 238, true, now())
on conflict do nothing;

-- Étiquettes des communautés de techno.
insert into tags (name)
values ('flutter'), ('mobile-money'), ('spring-boot'), ('android'), ('mpesa'), ('webhooks'), ('laravel')
on conflict do nothing;

-- Questions qui font vivre les communautés : un pays et des étiquettes chacune.
create temporary table seed_questions (
    author   varchar(30),
    title    varchar(150),
    body     text,
    country  varchar(2),
    operator varchar(20),
    network  varchar(20),
    tags     text[],
    age      interval
) on commit drop;

insert into seed_questions values
    ('awa_k', 'Le webhook Wave arrive deux fois et je crédite le client deux fois',
     'Sur notre API Spring Boot, Wave renvoie parfois le même événement checkout.session.completed à quelques secondes d''intervalle. Le client est crédité deux fois. Comment rendre le traitement idempotent sans bloquer les paiements suivants ?',
     'SN', 'WAVE', 'GOOD', array['mobile-money', 'webhooks', 'spring-boot'], interval '3 days'),
    ('fatou_n', 'Flutter : l''écran de paiement se fige sur Android Go en 3G',
     'Mon application Flutter se fige environ 4 secondes quand on ouvre l''écran de paiement sur un Tecno avec Android Go, en 3G. En wifi tout va bien. J''ai déjà retiré les animations. Par où commencer le profilage ?',
     'SN', 'ORANGE_MONEY', 'UNSTABLE', array['flutter', 'android'], interval '6 days'),
    ('wanjiru_k', 'Daraja STK Push : le callback ne revient jamais en sandbox',
     'L''appel STK Push renvoie bien ResponseCode 0, le téléphone de test reçoit la demande, mais mon CallBackURL n''est jamais appelé. L''URL est en https avec un certificat Let''s Encrypt. Faut-il l''enregistrer quelque part côté Safaricom ?',
     'KE', 'MPESA', 'GOOD', array['mpesa', 'mobile-money', 'webhooks'], interval '2 days'),
    ('amina_h', 'Synchroniser une base Flutter hors ligne quand le réseau revient',
     'Nos agents saisissent des fiches sans réseau pendant la journée. Avec sqflite, quelle stratégie pour renvoyer les fiches au serveur au retour du réseau sans doublon, et que faire en cas de conflit ?',
     'KE', null, 'VERY_POOR', array['flutter'], interval '9 days'),
    ('kouassi_y', 'Orange Money Côte d''Ivoire refuse mon URL de retour en localhost',
     'En test, l''API Web Payment d''Orange Money CI répond 400 dès que return_url pointe vers http://localhost:8000. Comment tester le parcours complet en local avec Laravel ?',
     'CI', 'ORANGE_MONEY', 'GOOD', array['mobile-money', 'laravel'], interval '4 days'),
    ('kwame_a', 'MTN MoMo : statut PENDING qui ne passe jamais à SUCCESSFUL',
     'Avec l''API Collection de MTN MoMo au Ghana, certaines demandes restent PENDING plusieurs heures alors que le client a validé. Faut-il interroger le statut en boucle, et à quel rythme sans se faire limiter ?',
     'GH', 'MTN_MOMO', 'UNSTABLE', array['mobile-money', 'spring-boot'], interval '1 day'),
    ('moussa_s', 'Firebase Auth par SMS trop lente au Sénégal : quelles alternatives ?',
     'Le code SMS de Firebase Auth met parfois plus d''une minute à arriver chez nos utilisateurs à Thiès. Quelles solutions avez-vous essayées : autre fournisseur SMS, WhatsApp, connexion par email ?',
     'SN', null, 'UNSTABLE', array['flutter', 'android'], interval '12 days'),
    ('chinedu_o', 'Réconcilier les paiements Paystack et les transferts mobiles en fin de journée',
     'Nous recevons des paiements par carte via Paystack et des transferts mobiles. Chaque soir, quelques écarts restent. Quelle structure de table et quel traitement pour une réconciliation fiable ?',
     'NG', 'OTHER', 'GOOD', array['mobile-money', 'webhooks'], interval '5 days');

insert into questions (author_id, title, body_markdown, body_html, country_code, mobile_money_operator,
                       network_quality, tags_text, created_at, updated_at)
select u.id, s.title, s.body, '<p>' || replace(replace(s.body, '&', '&amp;'), '<', '&lt;') || '</p>',
       s.country, s.operator, s.network, array_to_string(array(select unnest(s.tags) order by 1), ' '),
       now() - s.age, now() - s.age
from seed_questions s join users u on u.username = s.author
where not exists (select 1 from questions q where q.title = s.title);

insert into question_tags (question_id, tag_id)
select q.id, t.id
from seed_questions s
join questions q on q.title = s.title
join tags t on t.name = any (s.tags)
on conflict do nothing;

-- Points gagnés ce mois-ci sur ces questions : ils font les « membres les plus utiles du mois ».
insert into reputation_events (user_id, delta, reason, question_id, created_at)
select u.id, e.delta, e.reason, q.id, now() - e.age
from (values ('awa_k', 'Le webhook Wave arrive deux fois et je crédite le client deux fois', 25, 'ANSWER_ACCEPTED', interval '2 days'),
             ('fatou_n', 'Le webhook Wave arrive deux fois et je crédite le client deux fois', 10, 'ANSWER_UPVOTED', interval '2 days'),
             ('moussa_s', 'Flutter : l''écran de paiement se fige sur Android Go en 3G', 25, 'ANSWER_ACCEPTED', interval '5 days'),
             ('fatou_n', 'Firebase Auth par SMS trop lente au Sénégal : quelles alternatives ?', 20, 'ANSWER_UPVOTED', interval '10 days'),
             ('amina_h', 'Daraja STK Push : le callback ne revient jamais en sandbox', 25, 'ANSWER_ACCEPTED', interval '1 day'),
             ('wanjiru_k', 'Synchroniser une base Flutter hors ligne quand le réseau revient', 15, 'ANSWER_UPVOTED', interval '8 days'),
             ('kwame_a', 'Orange Money Côte d''Ivoire refuse mon URL de retour en localhost', 10, 'ANSWER_UPVOTED', interval '3 days'),
             ('kouassi_y', 'MTN MoMo : statut PENDING qui ne passe jamais à SUCCESSFUL', 25, 'ANSWER_ACCEPTED', interval '1 day'))
         as e(username, title, delta, reason, age)
join users u on u.username = e.username
join questions q on q.title = e.title
where not exists (select 1 from reputation_events r
                  where r.user_id = u.id and r.question_id = q.id and r.reason = e.reason);

-- Les premières communautés, créées par l'équipe.
insert into communities (slug, name, kind, country_code, tag_id, description, rules, created_at)
values ('senegal', 'Sénégal', 'COUNTRY', 'SN', null,
        'Développeurs de Dakar, Thiès, Saint-Louis et d''ailleurs : Wave, Orange Money, freelance et premiers emplois.',
        array['On écrit en français ou en anglais, et on reste courtois.',
              'Pas d''offre d''emploi ici : elles vont dans l''espace Emploi, où l''équipe les vérifie.',
              'Une question sur un opérateur précise lequel : Wave, Orange Money, Free Money.'],
        now() - interval '34 days'),
       ('kenya', 'Kenya', 'COUNTRY', 'KE', null,
        'De Nairobi à Mombasa : M-Pesa, Daraja API, startups et missions à distance.',
        array['English or French, always courteous.', 'Pour M-Pesa, précisez sandbox ou production.'],
        now() - interval '30 days'),
       ('cote-d-ivoire', 'Côte d''Ivoire', 'COUNTRY', 'CI', null,
        'Abidjan, Bouaké, Yamoussoukro : Orange Money, MTN, Moov Money et le commerce en ligne ivoirien.',
        array['On reste courtois, en français ou en anglais.'],
        now() - interval '21 days'),
       ('ghana', 'Ghana', 'COUNTRY', 'GH', null,
        'Accra, Kumasi et au-delà : MTN MoMo, fintech et communauté des développeurs ghanéens.',
        array[]::text[], now() - interval '18 days')
on conflict do nothing;

insert into communities (slug, name, kind, country_code, tag_id, description, rules, created_at)
select c.slug, c.name, 'TECH', null, t.id, c.description, c.rules, now() - c.age
from (values ('flutter', 'Flutter', 'flutter',
              'Applications Flutter légères qui tiennent en 3G et sur Android Go, du prototype à la publication.',
              array['Indiquez la version de Flutter et l''appareil de test.'], interval '33 days'),
             ('mobile-money', 'Mobile money', 'mobile-money',
              'Intégrer Wave, Orange Money, MTN MoMo et M-Pesa : webhooks, réconciliation, cas d''erreur.',
              array['Précisez l''opérateur et le pays : les API diffèrent.',
                    'Jamais de clé, de jeton ou de numéro de client dans une question.'], interval '20 days'),
             ('spring-boot', 'Spring Boot', 'spring-boot',
              'Back-ends Java et Spring Boot pour les paiements, les API publiques et les tableaux de bord.',
              array[]::text[], interval '15 days'))
         as c(slug, name, tag, description, rules, age)
join tags t on t.name = c.tag
on conflict do nothing;

-- Référents nommés par l'équipe, dans l'ordre d'affichage.
insert into community_referents (community_id, user_id, position)
select c.id, u.id, r.position
from (values ('senegal', :'demo_username', 0), ('senegal', 'moussa_s', 1), ('kenya', 'wanjiru_k', 0),
             ('flutter', 'moussa_s', 0), ('mobile-money', :'demo_username', 0), ('mobile-money', 'wanjiru_k', 1),
             ('spring-boot', 'chinedu_o', 0))
         as r(slug, username, position)
join communities c on c.slug = r.slug
join users u on u.username = r.username
on conflict do nothing;

-- Membres. Le compte du jury est déjà dans quelques communautés, pas dans toutes : il peut en rejoindre une.
insert into community_members (community_id, user_id, joined_at)
select c.id, u.id, now() - m.age
from (values ('senegal', :'demo_username', interval '30 days'), ('senegal', 'moussa_s', interval '30 days'),
             ('senegal', 'fatou_n', interval '20 days'), ('senegal', 'awa_k', interval '25 days'),
             ('kenya', 'wanjiru_k', interval '28 days'), ('kenya', 'amina_h', interval '14 days'),
             ('cote-d-ivoire', 'kouassi_y', interval '19 days'), ('ghana', 'kwame_a', interval '16 days'),
             ('flutter', 'moussa_s', interval '32 days'), ('flutter', 'fatou_n', interval '20 days'),
             ('flutter', 'amina_h', interval '12 days'),
             ('mobile-money', :'demo_username', interval '19 days'), ('mobile-money', 'wanjiru_k', interval '19 days'),
             ('mobile-money', 'awa_k', interval '18 days'), ('mobile-money', 'kwame_a', interval '10 days'),
             ('mobile-money', 'kouassi_y', interval '9 days'), ('mobile-money', 'chinedu_o', interval '7 days'),
             ('spring-boot', 'chinedu_o', interval '15 days'), ('spring-boot', 'awa_k', interval '11 days'),
             ('spring-boot', 'kwame_a', interval '6 days'))
         as m(slug, username, age)
join communities c on c.slug = m.slug
join users u on u.username = m.username
on conflict do nothing;

-- Propositions (COM-2) : celle du jury, déjà acceptée, a créé « Mobile money » ; une autre attend dans la file
-- du back office.
insert into community_proposals (proposer_id, name, kind, tag_name, description, rules, status, community_id,
                                 reviewed_at, created_at)
select u.id, 'Mobile money', 'TECH', 'mobile-money', c.description, c.rules, 'APPROVED', c.id,
       now() - interval '20 days', now() - interval '22 days'
from users u, communities c
where u.username = :'demo_username' and c.slug = 'mobile-money'
  and not exists (select 1 from community_proposals p where p.name = 'Mobile money');

insert into community_proposals (proposer_id, name, kind, tag_name, description, rules, created_at)
select u.id, 'React Native', 'TECH', 'react-native',
       'Applications React Native pour l''Afrique : petits appareils, réseau instable, paiements mobiles.',
       array['Indiquez la version de React Native et d''Expo.'], now() - interval '1 day'
from users u
where u.username = 'chinedu_o'
  and not exists (select 1 from community_proposals p where p.name = 'React Native');

commit;
