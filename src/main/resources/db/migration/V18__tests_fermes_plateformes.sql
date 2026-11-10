-- Tests fermés sur l'App Store (TestFlight) et pour les applications web (TST-7). Les campagnes existantes restent
-- sur Google Play. Chaque plateforme a ses bornes ; le web n'a ni identifiant d'application ni décompte de jours.

alter table test_campaigns drop constraint test_campaigns_platform_check;
alter table test_campaigns add constraint test_campaigns_platform_check
    check (platform in ('GOOGLE_PLAY', 'APP_STORE', 'WEB'));

-- Identifiant Android ou Bundle ID ; jamais pour le web.
alter table test_campaigns alter column package_name drop not null;
alter table test_campaigns add constraint test_campaigns_package_name_platform_check
    check ((platform = 'WEB') = (package_name is null));

-- Google exige 12 testeurs ; les autres plateformes en acceptent un seul.
alter table test_campaigns drop constraint test_campaigns_testers_target_check;
alter table test_campaigns add constraint test_campaigns_testers_target_check
    check (testers_target between 1 and 100 and (platform <> 'GOOGLE_PLAY' or testers_target >= 12));

-- Web : 0 jour, pas de décompte. Google : 14 jours au moins.
alter table test_campaigns drop constraint test_campaigns_required_days_check;
alter table test_campaigns add constraint test_campaigns_required_days_check
    check (required_days between 0 and 60
        and (platform = 'WEB') = (required_days = 0)
        and (platform <> 'GOOGLE_PLAY' or required_days >= 14));

-- Une seule campagne en cours par application et par plateforme : un même identifiant peut exister sur Android
-- et sur iOS.
drop index test_campaigns_one_running_idx;
create unique index test_campaigns_one_running_idx on test_campaigns (platform, lower(package_name))
    where package_name is not null and status in ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');
