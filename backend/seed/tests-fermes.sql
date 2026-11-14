-- Données de démo des tests fermés Google Play (TST-1 à TST-6, docs/conception-tests-fermes.md).
-- À lancer après seed/communautes.sql, dont il reprend les membres, et après la migration V17.
--
-- Rejouable, et remis à zéro à chaque fois : les quatre campagnes de démo sont effacées puis recréées avec des dates
-- relatives à maintenant. La tâche horaire du back-end fait ensuite vivre les compteurs (rappels, fin des 14 jours),
-- on relance donc le script juste avant la démo pour retrouver exactement l'état ci-dessous.
--
-- Le compte du jury (variable psql demo_username) y joue les deux rôles :
--   - testeur de « Kobo Split » (Nigeria) : vérifié par le porteur, 6 jours sur 14, « toujours inscrit » à faire
--     aujourd'hui ; il reste 2 places, que le jury voit dans la liste ;
--   - porteur de « Wari Stock » (Sénégal) : un testeur à vérifier, un « à confirmer » depuis 4 jours, un qui vient
--     de rejoindre sans avoir encore déclaré l'installation.
-- Pour le back office : « Jollof Rider » attend la validation de l'équipe (porteuse nouvelle, 20 points), et
-- « Gbaka Abidjan » est terminée, ses 12 testeurs ont tenu 14 jours.

\set ON_ERROR_STOP on

begin;

do $$
begin
    if not exists (select 1 from users where username = 'moussa_s') then
        raise exception 'Lancer seed/communautes.sql avant seed/tests-fermes.sql';
    end if;
end
$$;

-- Testeurs en plus des membres de seed/communautes.sql : une campagne demande 12 personnes. Sans mot de passe.
insert into users (username, display_name, country_code, city, bio, reputation, email_verified, onboarded_at)
values ('ibrahima_b', 'Ibrahima Ba', 'SN', 'Ziguinchor', 'Développeur Android, Kotlin et Jetpack Compose.', 186, true, now()),
       ('adaeze_n', 'Adaeze Nwosu', 'NG', 'Enugu', 'Testeuse QA mobile, automatisation avec Appium.', 342, true, now()),
       ('njeri_w', 'Njeri Wambui', 'KE', 'Kisumu', 'Flutter pour des coopératives agricoles.', 129, true, now()),
       ('mariam_t', 'Mariam Traoré', 'ML', 'Bamako', 'Étudiante, premières applications Kotlin.', 64, true, now()),
       ('yaw_o', 'Yaw Owusu', 'GH', 'Kumasi', 'React Native et paiements MTN MoMo.', 271, true, now()),
       ('efua_m', 'Efua Mensah', 'GH', 'Takoradi', 'Première application Flutter, livraison de repas à Takoradi.', 20, true, now())
on conflict do nothing;

-- Remise à zéro des campagnes de démo (participations, pointages et historique partent en cascade).
delete from notifications
where target_type = 'PLAYTEST'
  and target_id in (select id from test_campaigns
                    where package_name in ('ng.kobosplit.app', 'sn.waristock.app', 'gh.jollofrider.app',
                                           'ci.gbaka.abidjan'));
delete from test_campaigns
where package_name in ('ng.kobosplit.app', 'sn.waristock.app', 'gh.jollofrider.app', 'ci.gbaka.abidjan');

create temporary table seed_campaigns (
    package      varchar(150),
    owner        varchar(30),
    app          varchar(80),
    description  text,
    instructions varchar(2000),
    target       int,
    status       varchar(20),
    age          interval,
    started      interval,
    completed    interval
) on commit drop;

insert into seed_campaigns values
    ('ng.kobosplit.app', 'chinedu_o', 'Kobo Split',
     'Kobo Split partage une note de restaurant entre amis et envoie à chacun sa part par Paystack ou par virement. Pensée pour les réseaux lents : tout marche hors ligne et se synchronise au retour de la 3G.',
     'Créez un groupe de trois personnes, ajoutez une note de 15 000 nairas et partagez-la. Coupez le réseau pendant le partage pour tester le mode hors ligne. Signalez tout plantage dans le groupe Google.',
     12, 'ACTIVE', interval '12 days', interval '11 days', null),
    ('sn.waristock.app', :'demo_username', 'Wari Stock',
     'Wari Stock aide les boutiquiers de quartier à suivre leur stock et leurs ventes à crédit, avec un rappel par SMS aux clients et l''encaissement par Wave ou Orange Money. Fonctionne en wolof et en français.',
     'Ajoutez cinq produits, enregistrez une vente à crédit puis son remboursement par Wave en mode test. Essayez l''application en wolof au moins une fois.',
     12, 'ACTIVE', interval '7 days', interval '7 days', null),
    ('gh.jollofrider.app', 'efua_m', 'Jollof Rider',
     'Jollof Rider met en relation les petits restaurants de Takoradi avec des livreurs à moto. Paiement à la livraison ou par MTN MoMo, suivi du livreur sur une carte légère.',
     'Passez une commande fictive et suivez le livreur de test sur la carte.',
     12, 'PENDING_REVIEW', interval '1 day', null, null),
    ('ci.gbaka.abidjan', 'kouassi_y', 'Gbaka Abidjan',
     'Gbaka Abidjan indique les lignes de gbaka et de wôrô-wôrô entre les communes d''Abidjan, avec les tarifs signalés par les usagers. Les cartes sont gardées sur le téléphone pour marcher sans réseau.',
     'Cherchez le trajet Yopougon vers Adjamé et signalez un tarif.',
     12, 'COMPLETED', interval '30 days', interval '29 days', interval '4 days');

insert into test_campaigns (owner_id, app_name, package_name, description_markdown, description_html, opt_in_url,
                            testers_target, required_days, instructions, status, reviewed_at, started_at,
                            completed_at, created_at, updated_at)
select u.id, s.app, s.package, s.description,
       '<p>' || replace(replace(s.description, '&', '&amp;'), '<', '&lt;') || '</p>',
       'https://play.google.com/apps/testing/' || s.package, s.target, 14, s.instructions, s.status,
       now() - s.started, now() - s.started, now() - s.completed, now() - s.age,
       coalesce(now() - s.completed, now() - s.started, now() - s.age)
from seed_campaigns s join users u on u.username = s.owner;

-- Participations. joined, confirmed, verified, last_check : il y a combien de temps ; null si pas encore fait.
create temporary table seed_participations (
    package    varchar(150),
    tester     varchar(30),
    status     varchar(20),
    joined     interval,
    confirmed  interval,
    verified   interval,
    last_check interval,
    dropped    interval,
    reason     varchar(300),
    email      varchar(254),
    replaces   varchar(30)
) on commit drop;

insert into seed_participations values
    -- Kobo Split : 10 places prises sur 12. Le jury est vérifié, 6 jours effectués, pointé hier.
    ('ng.kobosplit.app', :'demo_username', 'VERIFIED', interval '7 days', interval '6 days 2 hours', interval '6 days', interval '1 day', null, null, null, null),
    ('ng.kobosplit.app', 'wanjiru_k', 'VERIFIED', interval '11 days', interval '10 days', interval '9 days', interval '3 hours', null, null, 'wanjiru.k.dev@gmail.com', null),
    ('ng.kobosplit.app', 'moussa_s', 'CONFIRMED', interval '10 days', interval '9 days', null, interval '4 days', null, null, null, null),
    ('ng.kobosplit.app', 'ibrahima_b', 'VERIFIED', interval '11 days', interval '10 days 6 hours', interval '9 days', interval '5 hours', null, null, null, null),
    ('ng.kobosplit.app', 'adaeze_n', 'VERIFIED', interval '11 days', interval '11 days', interval '10 days', interval '2 hours', null, null, 'adaeze.qa@gmail.com', null),
    ('ng.kobosplit.app', 'njeri_w', 'VERIFIED', interval '9 days', interval '8 days', interval '7 days', interval '20 hours', null, null, null, null),
    ('ng.kobosplit.app', 'mariam_t', 'CONFIRMED', interval '5 days', interval '5 days', null, interval '1 day', null, null, null, null),
    ('ng.kobosplit.app', 'yaw_o', 'VERIFIED', interval '10 days', interval '10 days', interval '8 days', interval '6 hours', null, null, null, null),
    ('ng.kobosplit.app', 'awa_k', 'CONFIRMED', interval '3 days', interval '3 days', null, interval '1 day', null, null, null, null),
    ('ng.kobosplit.app', 'fatou_n', 'DROPPED', interval '6 days', null, null, null, interval '4 days', 'Installation non déclarée sous 48 heures', null, null),
    ('ng.kobosplit.app', 'amina_h', 'CONFIRMED', interval '3 days', interval '2 days', null, interval '1 day', null, null, null, 'fatou_n'),
    -- Wari Stock, porté par le jury : 5 places prises sur 12.
    ('sn.waristock.app', 'kouassi_y', 'CONFIRMED', interval '3 days', interval '2 days', null, interval '10 hours', null, null, 'yao.kouassi.ci@gmail.com', null),
    ('sn.waristock.app', 'awa_k', 'VERIFIED', interval '6 days', interval '5 days', interval '4 days', interval '8 hours', null, null, null, null),
    ('sn.waristock.app', 'kwame_a', 'CONFIRMED', interval '7 days', interval '6 days', null, interval '4 days', null, null, null, null),
    ('sn.waristock.app', 'moussa_s', 'VERIFIED', interval '4 days', interval '3 days', interval '2 days', interval '12 hours', null, null, null, null),
    ('sn.waristock.app', 'fatou_n', 'JOINED', interval '3 hours', null, null, null, null, null, null, null);

-- Gbaka Abidjan : 12 testeurs qui ont tenu 14 jours.
insert into seed_participations
select 'ci.gbaka.abidjan', t, 'COMPLETED', interval '28 days', interval '18 days' + interval '1 day' * (n % 4),
       interval '17 days', interval '4 days', null, null, null, null
from unnest(array[:'demo_username', 'moussa_s', 'wanjiru_k', 'chinedu_o', 'fatou_n', 'awa_k', 'kwame_a', 'amina_h',
                  'ibrahima_b', 'adaeze_n', 'njeri_w', 'yaw_o']) with ordinality as x(t, n);

insert into test_participations (campaign_id, tester_id, google_email, status, joined_at, confirmed_at, verified_at,
                                 verified_by, ends_at, last_check_in_at, completed_at, dropped_at, drop_reason,
                                 install_reminded)
select c.id, u.id, p.email, p.status, now() - p.joined, now() - p.confirmed, now() - p.verified,
       case when p.verified is not null then c.owner_id end,
       now() - p.confirmed + interval '14 days',
       case when p.status = 'COMPLETED' then now() - p.confirmed + interval '14 days' else now() - p.last_check end,
       case when p.status = 'COMPLETED' then now() - p.confirmed + interval '14 days' end,
       now() - p.dropped, p.reason, p.dropped is not null
from seed_participations p
join test_campaigns c on c.package_name = p.package
join users u on u.username = p.tester;

update test_participations r
set replaces_id = o.id
from seed_participations p
join test_campaigns c on c.package_name = p.package
join users nu on nu.username = p.tester
join users ou on ou.username = p.replaces
join test_participations o on o.campaign_id = c.id and o.tester_id = ou.id
where p.replaces is not null and r.campaign_id = c.id and r.tester_id = nu.id;

-- « Toujours inscrit » du dernier pointage.
insert into test_check_ins (participation_id, day)
select id, (last_check_in_at at time zone 'UTC')::date from test_participations p
where last_check_in_at is not null and status in ('CONFIRMED', 'VERIFIED')
  and campaign_id in (select id from test_campaigns where package_name in ('ng.kobosplit.app', 'sn.waristock.app'))
on conflict do nothing;

-- Historique, lu par le back office.
insert into test_campaign_events (campaign_id, actor_id, action, created_at)
select id, owner_id, 'CREATED', created_at from test_campaigns
where package_name in ('ng.kobosplit.app', 'sn.waristock.app', 'gh.jollofrider.app', 'ci.gbaka.abidjan');
insert into test_campaign_events (campaign_id, actor_id, action, created_at)
select id, owner_id, case when status = 'PENDING_REVIEW' then 'SUBMITTED' else 'AUTO_APPROVED' end,
       coalesce(started_at, created_at + interval '20 minutes') from test_campaigns
where package_name in ('ng.kobosplit.app', 'sn.waristock.app', 'gh.jollofrider.app', 'ci.gbaka.abidjan');
insert into test_campaign_events (campaign_id, participation_id, actor_id, action, note, created_at)
select p.campaign_id, p.id, e.actor, e.action, e.note, e.at
from test_participations p
join test_campaigns c on c.id = p.campaign_id
cross join lateral (values
    (p.tester_id, case when p.replaces_id is null then 'JOINED' else 'REPLACED' end, null::varchar, p.joined_at),
    (p.tester_id, 'CONFIRMED', null, p.confirmed_at),
    (c.owner_id, 'VERIFIED', null, p.verified_at),
    (null::bigint, 'EXPIRED', p.drop_reason, case when p.status = 'DROPPED' then p.dropped_at end),
    (null::bigint, 'PARTICIPATION_COMPLETED', null, p.completed_at)) as e(actor, action, note, at)
where e.at is not null
  and c.package_name in ('ng.kobosplit.app', 'sn.waristock.app', 'gh.jollofrider.app', 'ci.gbaka.abidjan');
insert into test_campaign_events (campaign_id, action, created_at)
select id, 'COMPLETED', completed_at from test_campaigns where package_name = 'ci.gbaka.abidjan';

commit;
