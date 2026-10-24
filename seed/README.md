# Données de démo

`communautes.sql` ajoute les communautés (COM-1, COM-2) et ce qui les fait vivre :

- **9 membres** au Sénégal, au Kenya, au Nigeria, en Côte d'Ivoire et au Ghana ;
- **8 questions** avec leurs étiquettes et des points gagnés ce mois-ci (« membres les plus utiles ») ;
- **7 communautés** : Sénégal, Kenya, Côte d'Ivoire, Ghana, Flutter, Mobile money, Spring Boot, avec leurs règles et leurs Référents ;
- **2 propositions** : « Mobile money », acceptée, et « React Native », en attente dans la file du back office ;
- **le compte Référent du jury**, seul compte qui peut se connecter. Il est Référent de « Sénégal » et de « Mobile money », mais n'est pas membre de « Flutter » ni de « Kenya » : il peut les rejoindre pendant la démo, puis proposer une communauté.

Le script est rejouable : il ne crée rien deux fois. Il s'applique après les migrations Flyway, donc une fois que le back-end a démarré au moins une fois sur la base.

## Lancer

L'email et le mot de passe du compte du jury ne sont écrits nulle part dans le dépôt : on les passe en variables.

En local, avec `compose.dev.yaml` :

```sh
docker compose -f compose.dev.yaml exec -T db psql -U zetsu -d zetsu \
  -v demo_username=aminata_dev -v demo_email="$DEMO_EMAIL" -v demo_password="$DEMO_PASSWORD" \
  < seed/communautes.sql
```

Sur une autre base, la même commande avec `psql "$DATABASE_URL"` (forme `postgresql://`, pas `jdbc:`).

Le script active l'extension `pgcrypto` pour hacher le mot de passe en bcrypt. Il faut donc que l'utilisateur de la base ait le droit de la créer ; c'est le cas du propriétaire de la base dans `compose.dev.yaml`.

## Notes

- Avec le profil `demo`, le niveau Référent commence à 60 points. Les réputations du script dépassent aussi le seuil normal (1 500), donc la démo marche avec ou sans ce profil.
- Les réputations des membres sont posées directement : leur historique de points ne contient que les gains du mois qui servent aux communautés.
- Pour la démo de la proposition : se connecter avec le compte du jury, proposer une communauté depuis /communities/new, puis l'accepter ou la refuser depuis le back office.
