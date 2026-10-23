-- MOD-4 : motif de la suspension en cours, montré à l'équipe dans le back office.
alter table users add column suspension_reason varchar(500);
