# Données de démo

`communautes.sql` ajoute les communautés (COM-1, COM-2) et ce qui les fait vivre :

- **9 membres** au Sénégal, au Kenya, au Nigeria, en Côte d'Ivoire et au Ghana ;
- **8 questions** avec leurs étiquettes et des points gagnés ce mois-ci (« membres les plus utiles ») ;
- **7 communautés** : Sénégal, Kenya, Côte d'Ivoire, Ghana, Flutter, Mobile money, Spring Boot, avec leurs règles et leurs Référents ;
- **2 propositions** : « Mobile money », acceptée, et « React Native », en attente dans la file du back office ;
- **le compte Référent du jury**, seul compte qui peut se connecter. Il est Référent de « Sénégal » et de « Mobile money », mais n'est pas membre de « Flutter » ni de « Kenya » : il peut les rejoindre pendant la démo, puis proposer une communauté.

`projets-badges.sql` s'appuie sur ces membres et ces questions, et ajoute :

- **11 réponses**, dont 5 acceptées, qui donnent leur contenu aux badges (REP-4) ;
- **les badges** que ces contenus font gagner, avec les seuils du profil `demo` : le jury en a 5 sur 6, et Challenger est à 0/1 ;
- **5 projets** (PRJ-1 à PRJ-6) : 3 qui recrutent, 1 dont l'équipe est complète, 1 clôturé dont le membre a gagné ses 10 points ;
- **le jury dans deux rôles** : porteur de « Annuaire des développeurs du Sénégal », avec deux demandes en attente sur le même rôle (en accepter une refuse l'autre), et membre de « Tontine Cash », dont il peut alimenter le fil ou qu'il peut quitter.

`photos.sql` donne une photo de profil aux 9 membres de démo, jury compris : des avatars dessinés (`seed/avatars/`, WebP de 2 Ko environ), jamais des photos de vraies personnes. Il ne remplace jamais une photo déjà mise par un membre ou venue de GitHub ou Google.

Les deux premiers scripts sont rejouables : ils ne créent rien deux fois, `photos.sql` non plus. Ils s'appliquent après les migrations Flyway, donc une fois que le back-end a démarré au moins une fois sur la base, et dans cet ordre : `communautes.sql` puis `projets-badges.sql`. Le second a besoin des migrations V13 (badges) et V14 (projets).

## Lancer

L'email et le mot de passe du compte du jury ne sont écrits nulle part dans le dépôt : on les passe en variables.

En local, avec `compose.dev.yaml` :

```sh
docker compose -f compose.dev.yaml exec -T db psql -U zetsu -d zetsu \
  -v demo_username=aminata_dev -v demo_email="$DEMO_EMAIL" -v demo_password="$DEMO_PASSWORD" \
  < seed/communautes.sql

docker compose -f compose.dev.yaml exec -T db psql -U zetsu -d zetsu \
  -v demo_username=aminata_dev -v demo_email="$DEMO_EMAIL" -v demo_password="$DEMO_PASSWORD" \
  < seed/projets-badges.sql
```

Pour les photos, on copie d'abord les images dans le dossier des téléversements (`UPLOADS_DIR`, par défaut `data/uploads`), puis on lance le script. Sans la copie, les profils pointent vers des images introuvables.

```sh
mkdir -p data/uploads/avatars && cp seed/avatars/*.webp data/uploads/avatars/
docker compose -f compose.dev.yaml exec -T db psql -U zetsu -d zetsu \
  -v demo_username=aminata_dev < seed/photos.sql
```

En production, les images vont dans le volume des téléversements du conteneur de l'application, par exemple `docker compose cp seed/avatars/. app:<UPLOADS_DIR>/avatars/`, avant de lancer `photos.sql` sur la base.

### Photos avec Cloudinary (serveur sans disque durable)

Si le back-end tourne avec Cloudinary (variables `CLOUDINARY_*`), on n'utilise pas la copie dans `UPLOADS_DIR` : elle disparaît au redéploiement. Les avatars vont une fois pour toutes chez Cloudinary, puis les profils de démo pointent vers eux.

```sh
set -a; . ./.env; set +a          # CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER
bash seed/avatars-cloudinary.sh   # envoie les 9 avatars ; rejouable, une image renvoyée est écrasée
psql "$DATABASE_URL" -v demo_username=aminata_dev   -v cloud_name="$CLOUDINARY_CLOUD_NAME" -v folder="${CLOUDINARY_FOLDER:-zetsu}" < seed/photos-cloudinary.sql
```

`photos-cloudinary.sql` est rejouable. Il ne change qu'un profil sans photo, ou qui pointe encore vers l'avatar de démo posé sur le disque par `photos.sql` : on peut donc le lancer sur une base déjà remplie avec l'ancienne méthode. Une photo mise par le membre, ou venue de GitHub ou Google, n'est jamais touchée. Le script `.sh` demande `bash`, `curl` et `sha1sum` (présents dans Git Bash sous Windows) ; le secret sert seulement à signer sur la machine, il n'est jamais envoyé.

Sur une autre base, la même commande avec `psql "$DATABASE_URL"` (forme `postgresql://`, pas `jdbc:`).

Le script active l'extension `pgcrypto` pour hacher le mot de passe en bcrypt. Il faut donc que l'utilisateur de la base ait le droit de la créer ; c'est le cas du propriétaire de la base dans `compose.dev.yaml`.

## Notes

- Avec le profil `demo`, le niveau Référent commence à 60 points. Les réputations du script dépassent aussi le seuil normal (1 500), donc la démo marche avec ou sans ce profil.
- Les réputations des membres sont posées directement : leur historique de points ne contient que les gains du mois qui servent aux communautés.
- Pour la démo de la proposition : se connecter avec le compte du jury, proposer une communauté depuis /communities/new, puis l'accepter ou la refuser depuis le back office.
- Les badges sont recalculés depuis les contenus à chaque action : un badge gagné ne se perd pas, il reste affiché si l'on démarre ensuite sans le profil `demo`, même si la progression est sous le seuil normal.
- Pour la démo des projets : se connecter avec le compte du jury, ouvrir « Annuaire des développeurs du Sénégal », accepter une des deux demandes sur « Développeur front React » (l'autre est refusée et notifiée, le projet passe « En cours »), puis clôturer le projet : les deux membres gagnent 10 points.
