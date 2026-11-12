-- Tests fermés : date de fin souhaitée, à titre indicatif comme la date de début. Pour le web (pas de décompte de
-- jours), c'est la seule façon d'annoncer la durée du test.

alter table test_campaigns add column desired_end date;
alter table test_campaigns add constraint test_campaigns_desired_dates
    check (desired_end is null or desired_start is null or desired_end >= desired_start);
