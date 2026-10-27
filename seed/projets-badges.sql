-- Données de démo des réponses, des badges (REP-4) et de l'espace Projets (PRJ-1 à PRJ-6).
-- Rejouable à volonté : rien n'est créé deux fois. À lancer après seed/communautes.sql, dont il reprend les
-- membres et les questions, et après les migrations V13 (badges) et V14 (projets).
--
-- Le compte du jury (variable psql demo_username) y joue tous les rôles utiles à la démo :
--   - il a répondu à quatre questions, dont deux réponses acceptées : cinq badges sur six, Challenger à 0/1 ;
--   - il porte « Annuaire des développeurs du Sénégal », avec deux demandes en attente à accepter ou refuser ;
--   - il est membre de « Tontine Cash » : il peut écrire dans le fil ou quitter l'équipe.
-- Les badges suivent les seuils du profil « demo » (Entraide 3, Résolveur 2, Polyglotte 2, Aide locale 2).

\set ON_ERROR_STOP on

begin;

-- Sans les membres de seed/communautes.sql, rien ne peut se rattacher : on s'arrête avec un message clair.
do $$
begin
    if not exists (select 1 from users where username = 'moussa_s') then
        raise exception 'Lancer seed/communautes.sql avant seed/projets-badges.sql';
    end if;
end
$$;

insert into tags (name)
values ('firebase'), ('django'), ('python'), ('vue'), ('react'), ('figma'), ('documentation'), ('postgresql')
on conflict do nothing;

-- Réponses aux questions de seed/communautes.sql. Elles donnent leur contenu aux badges.
create temporary table seed_answers (
    author   varchar(30),
    question varchar(150),
    body     text,
    score    int,
    accepted boolean,
    age      interval
) on commit drop;

insert into seed_answers values
    (:'demo_username', 'Le webhook Wave arrive deux fois et je crédite le client deux fois',
     'Enregistrez l''identifiant de l''événement Wave dans une table avec un index unique, dans la même transaction que le crédit. Le deuxième envoi échoue sur l''index : vous répondez 200 à Wave sans créditer une seconde fois.',
     6, true, interval '2 days'),
    ('fatou_n', 'Le webhook Wave arrive deux fois et je crédite le client deux fois',
     'Vérifiez aussi la signature du webhook avant tout traitement, sinon n''importe qui peut rejouer l''appel.',
     3, false, interval '2 days'),
    ('moussa_s', 'Flutter : l''écran de paiement se fige sur Android Go en 3G',
     'Lancez l''application en mode profile et ouvrez DevTools : sur Android Go, c''est souvent le décodage d''images trop grandes. Redimensionnez-les côté serveur et utilisez cacheWidth sur Image.network.',
     4, true, interval '5 days'),
    ('fatou_n', 'Firebase Auth par SMS trop lente au Sénégal : quelles alternatives ?',
     'Nous sommes passés à un code envoyé par WhatsApp via un fournisseur local, avec le SMS en secours après 30 secondes. Les délais sont passés sous 10 secondes à Thiès.',
     5, false, interval '10 days'),
    (:'demo_username', 'Firebase Auth par SMS trop lente au Sénégal : quelles alternatives ?',
     'Proposez aussi la connexion par lien envoyé par email : elle ne dépend pas du réseau SMS et marche bien en 3G.',
     2, false, interval '9 days'),
    ('amina_h', 'Daraja STK Push : le callback ne revient jamais en sandbox',
     'En sandbox, Safaricom refuse les URL qui contiennent le mot « mpesa » ou « safaricom ». Renommez votre route de callback et réessayez.',
     3, true, interval '1 day'),
    ('wanjiru_k', 'Synchroniser une base Flutter hors ligne quand le réseau revient',
     'Donnez à chaque fiche un identifiant UUID créé sur le téléphone : le serveur ignore un UUID déjà reçu. En cas de conflit, gardez la version la plus récente et journalisez l''autre.',
     2, false, interval '8 days'),
    ('kwame_a', 'Orange Money Côte d''Ivoire refuse mon URL de retour en localhost',
     'Utilisez un tunnel HTTPS public vers votre poste pendant les tests, et déclarez cette adresse comme URL de retour.',
     1, false, interval '3 days'),
    ('kouassi_y', 'MTN MoMo : statut PENDING qui ne passe jamais à SUCCESSFUL',
     'Ne bouclez pas : configurez le callback X-Callback-Url, et gardez une vérification du statut toutes les 5 minutes pendant une heure au plus pour les cas où le callback se perd.',
     2, true, interval '1 day'),
    (:'demo_username', 'MTN MoMo : statut PENDING qui ne passe jamais à SUCCESSFUL',
     'Côté Spring Boot, un @Scheduled qui ne relit que les transactions PENDING de plus de 2 minutes suffit ; indexez la colonne de statut.',
     3, false, interval '20 hours'),
    (:'demo_username', 'Réconcilier les paiements Paystack et les transferts mobiles en fin de journée',
     'Une table de mouvements unique, avec la source (Paystack ou opérateur), la référence externe et le montant. Le soir, un rapprochement par référence puis par montant et heure, et une file des écarts à traiter à la main.',
     4, true, interval '4 days');

insert into answers (question_id, author_id, body_markdown, body_html, score, created_at, updated_at)
select q.id, u.id, a.body, '<p>' || replace(replace(a.body, '&', '&amp;'), '<', '&lt;') || '</p>', a.score,
       now() - a.age, now() - a.age
from seed_answers a
join users u on u.username = a.author
join questions q on q.title = a.question
where not exists (select 1 from answers x where x.question_id = q.id and x.author_id = u.id);

update questions q
set accepted_answer_id = x.id
from seed_answers a
join users u on u.username = a.author
join questions sq on sq.title = a.question
join answers x on x.question_id = sq.id and x.author_id = u.id
where a.accepted and q.id = sq.id and q.accepted_answer_id is null;

update questions q
set answer_count = (select count(*) from answers a where a.question_id = q.id and not a.hidden)
where q.title in (select question from seed_answers);

-- Projets.
create temporary table seed_projects (
    owner       varchar(30),
    title       varchar(120),
    description text,
    type        varchar(20),
    techs       text[],
    github      varchar(200),
    contact     varchar(200),
    status      varchar(20),
    age         interval,
    activity    interval
) on commit drop;

insert into seed_projects values
    ('moussa_s', 'Tontine Cash, cotisations de tontine par Wave et Orange Money',
     'Une application pour gérer les cotisations d''une tontine entre collègues : rappels par SMS, paiement par Wave ou Orange Money, historique partagé entre les membres. Pensée pour Android Go et la 3G.',
     'STARTUP', array['flutter', 'firebase', 'mobile-money'], 'https://github.com/tontine-cash/app',
     'https://discord.gg/tontinecash', 'OPEN', interval '25 days', interval '1 day'),
    ('wanjiru_k', 'Daraja Kit, bibliothèque M-Pesa open source pour Django',
     'Une bibliothèque Django qui couvre STK Push, B2C et la réconciliation des paiements M-Pesa, avec des exemples testés en sandbox et une documentation en anglais et en français.',
     'OPEN_SOURCE', array['django', 'python', 'mpesa'], 'https://github.com/daraja-kit/daraja-kit',
     'https://t.me/darajakit', 'IN_PROGRESS', interval '40 days', interval '3 days'),
    ('kouassi_y', 'Carte des pharmacies de garde à Abidjan',
     'Un site léger et une application qui affichent les pharmacies de garde de la semaine à Abidjan, mises à jour par des bénévoles à partir des listes officielles.',
     'VOLUNTEER', array['laravel', 'vue'], null, 'https://chat.whatsapp.com/pharmaciesabidjan', 'OPEN',
     interval '12 days', interval '2 days'),
    (:'demo_username', 'Annuaire des développeurs du Sénégal',
     'Un annuaire ouvert des développeurs sénégalais, par ville et par techno, pour faciliter les missions entre pairs et les recrutements locaux. Projet d''étude mené avec des étudiants de l''UGB et de l''ESP.',
     'STUDY', array['react', 'spring-boot', 'postgresql'], 'https://github.com/annuaire-dev-sn/annuaire',
     'https://discord.gg/annuairedevsn', 'OPEN', interval '15 days', interval '6 hours'),
    ('awa_k', 'Calculateur des frais Orange Money et Wave',
     'Un petit outil web qui compare les frais d''envoi et de retrait entre Orange Money et Wave selon le montant. Terminé et utilisé par plusieurs associations de Dakar.',
     'OPEN_SOURCE', array['react', 'mobile-money'], 'https://github.com/frais-mobile-money/calculateur',
     null, 'CLOSED', interval '70 days', interval '20 days');

insert into projects (owner_id, title, description_markdown, description_html, type, github_url, contact_url, status,
                      created_at, updated_at, last_activity_at)
select u.id, p.title, p.description, '<p>' || replace(replace(p.description, '&', '&amp;'), '<', '&lt;') || '</p>',
       p.type, p.github, p.contact, p.status, now() - p.age, now() - p.activity, now() - p.activity
from seed_projects p join users u on u.username = p.owner
where not exists (select 1 from projects x where x.title = p.title);

insert into project_technologies (project_id, tag_id, position)
select x.id, t.id, array_position(p.techs, t.name::text) - 1
from seed_projects p
join projects x on x.title = p.title
join tags t on t.name = any (p.techs)
on conflict do nothing;

-- Rôles : statut et membre éventuel. Un rôle pourvu a son membre accepté plus bas.
create temporary table seed_roles (
    ord     int,
    project varchar(120),
    title   varchar(80),
    techs   text[],
    holder  varchar(30)
) on commit drop;

insert into seed_roles values
    (1, 'Tontine Cash, cotisations de tontine par Wave et Orange Money', 'Développeuse back-end Spring Boot',
     array['spring-boot', 'postgresql'], :'demo_username'),
    (2, 'Tontine Cash, cotisations de tontine par Wave et Orange Money', 'Designer UX mobile', array['figma'], null),
    (3, 'Tontine Cash, cotisations de tontine par Wave et Orange Money', 'Testeur sur Android Go', array['android'], null),
    (4, 'Daraja Kit, bibliothèque M-Pesa open source pour Django', 'Développeur Python Django',
     array['django', 'python'], 'kwame_a'),
    (5, 'Daraja Kit, bibliothèque M-Pesa open source pour Django', 'Rédactrice de la documentation',
     array['documentation'], 'amina_h'),
    (6, 'Carte des pharmacies de garde à Abidjan', 'Développeur mobile Flutter', array['flutter'], null),
    (7, 'Carte des pharmacies de garde à Abidjan', 'Bénévole pour la saisie des listes', array[]::text[], null),
    (8, 'Annuaire des développeurs du Sénégal', 'Développeur front React', array['react'], null),
    (9, 'Annuaire des développeurs du Sénégal', 'Rédactrice français et anglais', array['documentation'], 'fatou_n'),
    (10, 'Calculateur des frais Orange Money et Wave', 'Développeur front React', array['react'], 'kwame_a');

insert into project_roles (project_id, title, status, created_at)
select x.id, r.title, case when r.holder is null then 'OPEN' else 'FILLED' end, x.created_at
from seed_roles r join projects x on x.title = r.project
where not exists (select 1 from project_roles y where y.project_id = x.id and y.title = r.title)
order by r.ord;

insert into project_role_technologies (role_id, tag_id, position)
select y.id, t.id, array_position(r.techs, t.name::text) - 1
from seed_roles r
join projects x on x.title = r.project
join project_roles y on y.project_id = x.id and y.title = r.title
join tags t on t.name = any (r.techs)
on conflict do nothing;

-- Demandes : acceptées (l'équipe), en attente (à décider pendant la démo) et une refusée pour l'historique.
create temporary table seed_requests (
    project  varchar(120),
    role     varchar(80),
    member   varchar(30),
    status   varchar(10),
    message  varchar(500),
    age      interval
) on commit drop;

insert into seed_requests values
    ('Tontine Cash, cotisations de tontine par Wave et Orange Money', 'Développeuse back-end Spring Boot',
     :'demo_username', 'ACCEPTED',
     'Je fais du Spring Boot et des intégrations Wave tous les jours, je peux monter l''API et les webhooks.',
     interval '20 days'),
    ('Tontine Cash, cotisations de tontine par Wave et Orange Money', 'Testeur sur Android Go', 'fatou_n', 'PENDING',
     'J''ai un Tecno sous Android Go et je teste déjà mes applications Flutter en 3G à Saint-Louis.',
     interval '2 days'),
    ('Daraja Kit, bibliothèque M-Pesa open source pour Django', 'Développeur Python Django', 'kwame_a', 'ACCEPTED',
     'J''ai intégré MTN MoMo en production, je voudrais apporter la même rigueur à M-Pesa.', interval '35 days'),
    ('Daraja Kit, bibliothèque M-Pesa open source pour Django', 'Rédactrice de la documentation', 'amina_h', 'ACCEPTED',
     'Je peux écrire la documentation en anglais et en swahili, et la relire en français.', interval '30 days'),
    ('Daraja Kit, bibliothèque M-Pesa open source pour Django', 'Développeur Python Django', 'chinedu_o', 'REFUSED',
     'Je connais bien Paystack et je voudrais découvrir M-Pesa.', interval '33 days'),
    ('Annuaire des développeurs du Sénégal', 'Développeur front React', 'awa_k', 'PENDING',
     'Je viens du back-end mais je fais du React sur mes projets perso, et je connais bien les besoins des PME de Dakar.',
     interval '1 day'),
    ('Annuaire des développeurs du Sénégal', 'Développeur front React', 'chinedu_o', 'PENDING',
     'React et React Native depuis quatre ans à Lagos, je peux livrer les écrans de recherche rapidement.',
     interval '10 hours'),
    ('Annuaire des développeurs du Sénégal', 'Rédactrice français et anglais', 'fatou_n', 'ACCEPTED',
     'J''écris en français et en anglais, et je peux préparer le guide de contribution.', interval '12 days'),
    ('Calculateur des frais Orange Money et Wave', 'Développeur front React', 'kwame_a', 'ACCEPTED',
     'Je peux faire l''interface et les tests des barèmes.', interval '65 days');

insert into project_members (project_id, user_id, role_id, role_title, status, message, created_at, decided_at)
select x.id, u.id, y.id, y.title, s.status, s.message, now() - s.age,
       case when s.status = 'PENDING' then null else now() - s.age + interval '1 day' end
from seed_requests s
join projects x on x.title = s.project
join project_roles y on y.project_id = x.id and y.title = s.role
join users u on u.username = s.member
where not exists (select 1 from project_members m where m.project_id = x.id and m.user_id = u.id
                  and m.role_title = s.role);

-- Fil de mises à jour.
insert into project_updates (project_id, author_id, text, created_at)
select x.id, u.id, f.text, now() - f.age
from (values ('Tontine Cash, cotisations de tontine par Wave et Orange Money', 'moussa_s',
              'Maquettes des écrans de cotisation validées avec trois tontines de Pikine.', interval '15 days'),
             ('Tontine Cash, cotisations de tontine par Wave et Orange Money', :'demo_username',
              'API des cotisations en ligne, le webhook Wave est branché en bac à sable.', interval '4 days'),
             ('Tontine Cash, cotisations de tontine par Wave et Orange Money', 'moussa_s',
              'On cherche encore quelqu''un pour tester sur Android Go avant la première version.', interval '1 day'),
             ('Daraja Kit, bibliothèque M-Pesa open source pour Django', 'wanjiru_k',
              'Version 0.3 publiée : STK Push et B2C couverts par les tests en sandbox.', interval '3 days'),
             ('Annuaire des développeurs du Sénégal', :'demo_username',
              'Le modèle de données est prêt. Il nous manque une personne pour les écrans React.', interval '6 hours'),
             ('Calculateur des frais Orange Money et Wave', 'awa_k',
              'Projet terminé : merci à Kwame, le calculateur est utilisé par quatre associations.', interval '20 days'))
         as f(project, author, text, age)
join projects x on x.title = f.project
join users u on u.username = f.author
where not exists (select 1 from project_updates p where p.project_id = x.id and p.text = f.text);

-- Projet clôturé : +10 pour son membre accepté (PRJ-6), une seule fois.
insert into reputation_events (user_id, delta, reason, project_id, created_at)
select m.user_id, 10, 'PROJECT_COMPLETED', x.id, x.last_activity_at
from projects x
join project_members m on m.project_id = x.id and m.status = 'ACCEPTED'
where x.title = 'Calculateur des frais Orange Money et Wave'
  and not exists (select 1 from reputation_events r where r.user_id = m.user_id and r.project_id = x.id);

-- Badges, avec les mêmes critères que BadgeService et les seuils du profil « demo ».
-- Un badge gagné ne se perd pas : ils restent si l'on démarre ensuite sans ce profil.
with counts as (
    select u.id,
           (select count(*) from questions where author_id = u.id and not hidden)
             + (select count(*) from answers where author_id = u.id and not hidden) as first_step,
           (select count(*) from answers where author_id = u.id and not hidden) as helper,
           (select count(*) from answers a join questions q on q.accepted_answer_id = a.id
             where a.author_id = u.id and not a.hidden) as solver,
           (select count(*) from submissions where member_id = u.id and status = 'VALIDATED') as challenger,
           (select count(distinct qt.tag_id) from answers a
             join questions q on q.id = a.question_id
             join question_tags qt on qt.question_id = q.id
             where a.author_id = u.id and not a.hidden and (a.score > 0 or q.accepted_answer_id = a.id)) as polyglot,
           (select count(*) from answers a
             join questions q on q.id = a.question_id
             where a.author_id = u.id and not a.hidden and q.author_id <> u.id
               and q.country_code = u.country_code) as local_help
    from users u
    where u.username in (:'demo_username', 'moussa_s', 'wanjiru_k', 'chinedu_o', 'kouassi_y', 'fatou_n', 'awa_k',
                         'kwame_a', 'amina_h')
)
insert into user_badges (user_id, badge, awarded_at)
select c.id, b.badge, now() - interval '1 day'
from counts c
cross join lateral (values ('FIRST_STEP', c.first_step >= 1), ('HELPER', c.helper >= 3),
                           ('SOLVER', c.solver >= 2), ('CHALLENGER', c.challenger >= 1),
                           ('POLYGLOT', c.polyglot >= 2), ('LOCAL_HELP', c.local_help >= 2)) as b(badge, reached)
where b.reached
on conflict do nothing;

commit;
