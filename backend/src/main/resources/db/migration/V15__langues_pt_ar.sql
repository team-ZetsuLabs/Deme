-- SET-3 : portugais et arabe en plus du français et de l'anglais (Angola, Mozambique, Cap-Vert ; Maghreb, Égypte, Soudan).
alter table users drop constraint users_language_check;
alter table users add constraint users_language_check check (language in ('fr', 'en', 'pt', 'ar'));
