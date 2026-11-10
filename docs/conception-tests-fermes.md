# Conception : tests fermés Google Play

Statut : **back-end codé** le 10 novembre 2026 (domaine `playtest`, migration V17, mocks `mocks/*playtests*`). Le site web et le back office restent à faire. Les écarts entre la proposition et le code sont signalés par « Codé : ».

## 1. Le besoin en une phrase

Un développeur avec un compte Google Play personnel doit réunir au moins 12 testeurs inscrits pendant 14 jours d'affilée avant de demander la mise en production. Zetsu organise l'entraide : chacun teste les applications des autres et trouve à son tour des testeurs pour la sienne.

## 2. Ce que Zetsu peut prouver, et ce qu'il ne peut pas

Google ne donne aucune API pour lire la liste des testeurs inscrits à un test fermé. Zetsu ne peut donc **rien vérifier automatiquement**. Le module distingue trois niveaux de preuve, et l'interface les affiche différemment :

| Niveau | Qui l'établit | Ce que ça veut dire |
| --- | --- | --- |
| Déclaré | le testeur | « J'ai rejoint le test et installé l'application. » Le décompte commence ici. |
| Vérifié | le porteur de la campagne | « J'ai vu son adresse dans la liste des testeurs de la Play Console. » |
| Terminé | le système | 14 jours écoulés depuis le début du décompte, sans abandon signalé. |

Un compteur à 14 n'est jamais présenté comme une conformité Google Play. Le texte d'interface dit « 14 jours déclarés » ou « 14 jours vérifiés ».

## 3. Domaine et rangement

Nouveau domaine back-end `playtest` (contrôleur, services, dépôts, DTO), comme les autres. Identifiants proposés pour le cahier : préfixe **TST** (TST-1 campagnes, TST-2 participation, TST-3 suivi des 14 jours, TST-4 notifications, TST-5 administration, TST-6 statistiques). À confirmer par l'équipe.

## 4. Modèle de données

### `test_campaigns`

| Colonne | Type | Règle |
| --- | --- | --- |
| id | bigserial | |
| owner_id | bigint → users | porteur |
| platform | varchar(20) | `GOOGLE_PLAY` (plus tard `TESTFLIGHT`, sans changer le reste) |
| app_name | varchar(80) | obligatoire |
| package_name | varchar(150) | `com.exemple.app`, format vérifié ; une seule campagne non terminée par paquet |
| description_markdown, description_html | text | Markdown nettoyé côté serveur, comme partout |
| icon_url | varchar(300) | téléversée chez Cloudinary (même chemin que les photos de profil), 512 px au plus |
| opt_in_url | varchar(300) | doit commencer par `https://play.google.com/apps/testing/` ou `https://groups.google.com/` |
| testers_target | int | 12 à 100, 14 par défaut |
| required_days | int | 14, gardé en colonne si Google change la règle |
| desired_start | date | facultatif |
| instructions | text | consignes aux testeurs, texte brut |
| status | varchar(20) | voir section 5 |
| review_note | varchar(300) | motif d'un refus ou d'une suspension, montré au porteur |
| reviewed_by, reviewed_at | | décision de l'équipe |
| started_at, completed_at | timestamptz | |
| hidden | boolean | modération par signalement, comme les autres contenus |
| created_at, updated_at | timestamptz | |

### `test_participations`

| Colonne | Type | Règle |
| --- | --- | --- |
| id | bigserial | |
| campaign_id | bigint → test_campaigns | |
| tester_id | bigint → users | |
| google_email | varchar(254) | facultatif, voir section 9 ; jamais renvoyé dans les listes publiques |
| status | varchar(20) | voir section 6 |
| joined_at | timestamptz | clic sur « Je participe » |
| confirmed_at | timestamptz | déclaration d'installation : **début du décompte** |
| verified_at, verified_by | | vérification par le porteur |
| ends_at | timestamptz | `confirmed_at + required_days` |
| last_check_in_at | timestamptz | dernier « toujours inscrit » du testeur |
| completed_at, dropped_at | timestamptz | |
| drop_reason | varchar(300) | |
| replaces_id | bigint → test_participations | remplacement d'un testeur parti |

Contrainte : `unique (campaign_id, tester_id)`. Un membre ne rejoint jamais deux fois la même campagne, même après un abandon. Le porteur ne peut pas rejoindre sa propre campagne.

### `test_check_ins`

`(participation_id, day)` unique. Le testeur appuie une fois par jour sur « Toujours inscrit » (une ligne par jour). Ça sert à repérer les testeurs qui décrochent, pas à prouver quoi que ce soit.

### `test_campaign_events` (historique, traçabilité)

`campaign_id, participation_id, actor_id, action, note, created_at`. Codé : un motif en texte (`note`, 300 caractères) plutôt qu'un `details jsonb`, qui n'apportait rien de plus aux écrans prévus. Chaque action importante écrit une ligne : création, envoi en validation, validation, refus, suspension, réactivation, participation, confirmation, vérification, abandon, retrait par l'équipe, remplacement, fin. L'historique du back office se lit ici.

### Préparé pour les crédits (phase 2, inactif)

`credit_ledger (user_id, delta, reason, campaign_id, participation_id, created_at)`, sur le modèle de `reputation_events` : le solde est la somme des lignes, et rien n'est jamais modifié ni effacé. On crée la table en phase 2 seulement. Le reste du modèle n'a rien à changer pour l'accueillir : une participation terminée produit simplement une ligne de crédit.

## 5. Cycle de vie d'une campagne

```
DRAFT ──envoyer──▶ PENDING_REVIEW ──valider──▶ ACTIVE ──objectif atteint ou clôture──▶ COMPLETED
                         │                      │  ▲
                       refuser              suspendre │ réactiver
                         ▼                      ▼  │
                      REJECTED              SUSPENDED
```

- `DRAFT` : modifiable, invisible des autres.
- `PENDING_REVIEW` : en attente de l'équipe. Proposition pour alléger la file : un porteur de niveau Membre (50 points) ou plus passe directement en `ACTIVE`, seuls les nouveaux sont relus.
- `REJECTED` : le motif est montré au porteur, qui peut corriger et renvoyer (retour en `DRAFT`).
- `ACTIVE` : visible, accepte des testeurs tant qu'il reste des places.
- `SUSPENDED` : invisible, plus de nouvelles participations ; le décompte des participants en cours continue.
- `COMPLETED` : quand `testers_target` participations sont terminées, ou à la clôture par le porteur. Plus aucune participation.

« Complète » n'est pas un statut : c'est une campagne `ACTIVE` sans place libre. La liste la montre avec un filtre dédié.

## 6. Cycle de vie d'une participation et règle des 14 jours

```
JOINED ──confirme l'installation──▶ CONFIRMED ──le porteur vérifie──▶ VERIFIED
   │                                    │                               │
   │                                    └──── 14 jours écoulés ─────────┴──▶ COMPLETED
   │
   └──▶ DROPPED (le testeur se désiste)   REMOVED (porteur ou équipe, avec motif)
```

- Une place est prise dès `JOINED`. Sans confirmation sous 48 heures, la participation passe en `DROPPED` (motif « Installation non confirmée ») et la place se libère.
- Le décompte de chaque testeur part de **son** `confirmed_at`. Jours effectués = jours entiers écoulés depuis, plafonnés à `required_days`.
- Sans « toujours inscrit » depuis 3 jours, la participation est signalée « à confirmer » au porteur, et le testeur reçoit un rappel. L'abandon n'est jamais automatique à ce stade : seul le testeur, le porteur ou l'équipe le décide.
- `COMPLETED` est posé par une tâche planifiée quotidienne (comme la mise en pause des projets) quand `ends_at` est passé et que la participation est `CONFIRMED` ou `VERIFIED`.
- **Remplacement** : une participation `DROPPED` ou `REMOVED` libère sa place. Le nouveau testeur reçoit une participation neuve, avec son propre décompte qui repart à zéro, et `replaces_id` garde le lien pour l'historique.
- Places libres = `testers_target` − participations en `JOINED`, `CONFIRMED`, `VERIFIED` ou `COMPLETED`. Le contrôle et l'insertion se font sous verrou de la campagne : deux personnes ne peuvent pas prendre la dernière place en même temps.
- Progression de la campagne = moyenne des jours effectués des participations actives et terminées, rapportée à `testers_target × required_days`. On renvoie aussi le nombre de testeurs terminés, vérifiés et déclarés.

## 7. Notifications

De nouveaux `NotificationType`, dans le même système que les autres (NOT-1) :

| Type | Destinataire | Déclencheur |
| --- | --- | --- |
| PLAYTEST_NEW_CAMPAIGN | membres ayant des technologies mobiles (flutter, kotlin, android…) | campagne activée, au plus une par jour et par membre |
| PLAYTEST_JOINED | porteur | un testeur rejoint ou confirme |
| PLAYTEST_INSTALL_REMINDER | testeur | 24 h après `JOINED` sans confirmation |
| PLAYTEST_STAY_REMINDER | testeur | 3 jours sans « toujours inscrit » |
| PLAYTEST_ENDING_SOON | testeur et porteur | 2 jours avant `ends_at` |
| PLAYTEST_PARTICIPATION_DONE | testeur et porteur | participation `COMPLETED` |
| PLAYTEST_TESTER_LEFT | porteur | `DROPPED` ou `REMOVED` |
| PLAYTEST_TESTER_REPLACED | porteur | une place libérée est reprise |
| PLAYTEST_CAMPAIGN_FULL | porteur | plus de place libre |
| PLAYTEST_CAMPAIGN_REVIEWED | porteur | validée, refusée, suspendue ou réactivée |
| PLAYTEST_REMOVED | testeur | retiré par le porteur ou l'équipe (codé : ajouté, le motif est sur la participation) |

Les rappels sont envoyés par une tâche planifiée, qui n'envoie jamais deux fois le même rappel. Codé : la tâche tourne toutes les heures ; trois colonnes sur la participation (`install_reminded`, `stay_reminded_at`, `ending_notified`) remplacent `last_reminder_at`. Un « toujours inscrit » remet `stay_reminded_at` à zéro, pour qu'un nouveau décrochage soit de nouveau signalé. PLAYTEST_NEW_CAMPAIGN n'a pas de limite d'une par jour : avec quelques campagnes par semaine, elle n'est pas utile pour l'instant.

## 8. API

Préfixe `/api/v1`, pagination et erreurs habituelles.

### Espace membre

| Méthode et chemin | Rôle |
| --- | --- |
| `GET /playtests?status&availability=OPEN\|FULL\|IN_PROGRESS&page&size` | campagnes visibles |
| `GET /playtests/{id}` | détail, avec `myParticipation`, `canEdit`, `canJoin`, places restantes, progression, date de fin estimée |
| `POST /playtests` | créer (brouillon) |
| `PUT /playtests/{id}` | modifier (brouillon ou refusée) |
| `PUT /playtests/{id}/icon` (multipart) | icône, comme la photo de profil |
| `POST /playtests/{id}/submit` | envoyer en validation |
| `POST /playtests/{id}/close` | clôturer |
| `GET /playtests/mine` | mes campagnes |
| `GET /playtests/{id}/participations` | porteur : testeurs, jours effectués, niveau de preuve, « à confirmer » |
| `POST /playtests/{id}/participations` | rejoindre ; 409 `ALREADY_JOINED`, `CAMPAIGN_FULL`, `CAMPAIGN_NOT_ACTIVE` |
| `POST /playtests/{id}/participations/me/confirm` | déclarer l'installation, avec l'adresse Google en option |
| `POST /playtests/{id}/participations/me/check-in` | « toujours inscrit » ; 409 si déjà fait aujourd'hui |
| `POST /playtests/{id}/participations/me/withdraw` | se désister, avec un motif facultatif |
| `POST /playtests/{id}/participations/{pid}/verify` | porteur : vérifié dans la Play Console |
| `POST /playtests/{id}/participations/{pid}/remove` | porteur : retirer, avec un motif |
| `GET /users/me/playtest-participations` | mes participations et leurs compteurs |

### Back office (`/api/v1/admin/playtests`, rôles MODERATOR et ADMIN)

| Méthode et chemin | Rôle |
| --- | --- |
| `GET /admin/playtests?status&problem=INACTIVE\|STALLED\|REPORTED` | toutes les campagnes. INACTIVE : aucune participation depuis 7 jours ; STALLED : plus de 30 % de testeurs « à confirmer » |
| `POST /admin/playtests/{id}/review` `{ decision: APPROVE\|REJECT, note }` | validation |
| `POST /admin/playtests/{id}/suspend` et `/reactivate` `{ note }` | suspension |
| `GET /admin/playtests/{id}/participations` | participations, adresses Google comprises |
| `POST /admin/playtests/{id}/participations/{pid}/remove` `{ reason }` | retirer un testeur |
| `GET /admin/playtests/{id}/events` | historique de la campagne |
| `GET /admin/playtests/stats` | indicateurs ci-dessous |

Indicateurs : campagnes (total, actives, terminées, objectif atteint), porteurs distincts, testeurs distincts, participations en cours, participations terminées. Tout est calculé en SQL à la demande : pas de table de statistiques.

« Réaffecter » un testeur se fait en deux gestes déjà couverts : le retirer d'une campagne, puis il en rejoint une autre. Ça évite qu'un compteur passe d'une application à une autre.

## 9. Sécurité et données personnelles

- L'adresse Google n'est demandée que si le porteur en a besoin (liste de testeurs par adresse plutôt que par groupe Google). Elle n'est visible que du porteur et de l'équipe, et elle est effacée 30 jours après la fin de la participation.
- `opt_in_url` est vérifiée par liste blanche d'hôtes, comme tout lien de membre. On ne suit jamais le lien côté serveur.
- L'icône passe par les mêmes contrôles que la photo de profil : type réel, taille, nom régénéré.
- Limitation de débit sur la création de campagne et sur la participation. Une campagne se signale et se masque comme les autres contenus (MOD).
- Suppression de compte (AUTH-6) : ses campagnes non terminées sont clôturées, ses participations passent en `DROPPED`, les adresses Google sont effacées.

## 10. Lien avec la réputation

Codé : +5 points de réputation par participation terminée (raison `PLAYTEST_COMPLETED`), une seule fois par participation, sans plafond quotidien : la participation a demandé 14 jours, et plusieurs peuvent se terminer le même jour. C'est la version légère des crédits : la réputation sert déjà de monnaie d'entraide sur Zetsu, et les crédits de la phase 2 pourront s'y ajouter sans rien casser.

## 11. Charge estimée

| Projet | Contenu | Estimation |
| --- | --- | --- |
| Back-end | migration, domaine `playtest`, tâche quotidienne, notifications, admin, tests | 3 jours |
| Site web | liste, détail, création, parcours de participation, tableau de bord du porteur, mes participations | 3 à 4 jours |
| Back office | file de validation, campagnes problématiques, participations, historique, statistiques | 2 jours |
| Démo | données réalistes : 4 campagnes d'applications africaines à différents stades | 0,5 jour |

## 12. Décisions prises pour le code

Prises le 10 novembre 2026 pour avancer, à rediscuter si besoin :

1. Préfixe **TST**, module dans le périmètre avant le concours.
2. Relecture par l'équipe **seulement pour les porteurs de moins de 50 points** ; les autres publient directement.
3. Adresse Google **facultative**, demandée à la déclaration d'installation.
4. **+5** de réputation par participation terminée.

### Questions d'origine

1. Le préfixe TST vous convient-il, et le module entre-t-il dans le périmètre avant ou après le concours ?
2. Validation de toutes les campagnes par l'équipe, ou seulement celles des nouveaux membres ?
3. Demande-t-on l'adresse Google aux testeurs, ou seulement le lien de groupe ?
4. Récompense en réputation (+5) pour une participation terminée : oui ou non ?

## 13. App Store et applications web (TST-7, phase 2)

Statut : **back-end codé** le 10 novembre 2026 (migration V18, branche `backend/TST-7-plateformes`). Changement de contrat : à fusionner après le 15 novembre, une fois le site web prêt.

### Plateformes

`platform` est obligatoire à la création : `GOOGLE_PLAY`, `APP_STORE` ou `WEB`. Les campagnes existantes restent sur `GOOGLE_PLAY`. `tracking` (`DAILY` ou `NONE`) est déduit de la plateforme et renvoyé dans chaque campagne : le front s'appuie dessus pour ses libellés.

| | GOOGLE_PLAY | APP_STORE | WEB |
| --- | --- | --- | --- |
| `packageName` | identifiant Android, obligatoire | Bundle ID, obligatoire | ignoré, toujours `null` |
| `optInUrl` | `play.google.com/apps/testing/…` ou `groups.google.com/…` | `testflight.apple.com/join/…` | toute adresse `https://` avec un nom de domaine |
| `testersTarget` | 12 à 100 (14 par défaut) | 1 à 100 (10) | 1 à 100 (10) |
| `requiredDays` | 14 à 60 (14) | 1 à 60 (7) | toujours 0 |
| `tracking` | DAILY | DAILY | NONE |
| Relecture | nouveaux porteurs | nouveaux porteurs | **toujours** |

Une règle non respectée revient en `400 VALIDATION_ERROR`, avec le champ en cause dans `fields`. Une seule campagne en cours par application **et par plateforme** : le même identifiant peut tourner sur Android et sur iOS.

### Campagne sans décompte (web)

- À la déclaration d'installation, `endsAt` reste vide. Pas de « toujours inscrit » (`409 CHECK_IN_NOT_TRACKED`), pas de rappel, pas de fin automatique.
- `daysDone` compte les jours depuis l'installation, sans plafond. `progress.percent` est la part des places tenues par une installation déclarée.
- À la clôture par le porteur, les testeurs installés depuis au moins 24 heures terminent et gagnent leurs 5 points. Les autres partent avec un motif (installés trop récemment, ou installation jamais déclarée). Si le compte du porteur est supprimé, la tâche horaire fait la même chose.
- Le lien mène hors des stores : chaque campagne web est relue par l'équipe avant publication.

### Ce qui ne change pas

L'adresse déclarée par le testeur garde le nom `googleEmail` (pour TestFlight, c'est l'adresse Apple). On pourra ajouter un champ `testerEmail` plus tard sans rien casser.

Un exemple complet de campagne web est dans `docs/exemples/GET_playtests_id-campagne-web.json` ; `mocks/GET_playtests.json` contient une campagne de chaque plateforme.
