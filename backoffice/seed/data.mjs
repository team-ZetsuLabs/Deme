// Données de démonstration : réalistes et africaines (vrais pays, vrais opérateurs mobile money).
// Aucun mot de passe ici : il vient de l'environnement (voir seed/README.md).

/** Membres actifs : répondent beaucoup, atteignent le niveau Membre et peuvent voter et signaler. */
export const CORE = [
  {
    handle: 'aminata.diallo',
    name: 'Aminata Diallo',
    country: 'SN',
    tech: ['java', 'spring-boot', 'postgresql'],
  },
  {
    handle: 'kwame.asante',
    name: 'Kwame Asante',
    country: 'GH',
    tech: ['flutter', 'dart', 'firebase'],
  },
  {
    handle: 'fatou.ndiaye',
    name: 'Fatou Ndiaye',
    country: 'SN',
    tech: ['react', 'typescript', 'node.js'],
  },
  {
    handle: 'ibrahim.sawadogo',
    name: 'Ibrahim Sawadogo',
    country: 'BF',
    tech: ['laravel', 'php', 'mysql'],
  },
  {
    handle: 'awa.kane',
    name: 'Awa Kane',
    country: 'BF',
    tech: ['node.js', 'mobile-money', 'docker'],
  },
  {
    handle: 'seydou.ouedraogo',
    name: 'Seydou Ouédraogo',
    country: 'BF',
    tech: ['devops', 'docker', 'linux'],
  },
  {
    handle: 'grace.njeri',
    name: 'Grace Njeri',
    country: 'KE',
    tech: ['python', 'django', 'mpesa'],
  },
]

/** Membres qui posent surtout des questions. */
export const ASKERS = [
  {
    handle: 'moussa.traore',
    name: 'Moussa Traoré',
    country: 'ML',
    tech: ['laravel', 'mobile-money'],
  },
  { handle: 'youssef.benali', name: 'Youssef Benali', country: 'MA', tech: ['react', 'next.js'] },
  { handle: 'aicha.ouattara', name: 'Aïcha Ouattara', country: 'CI', tech: ['flutter', 'sqlite'] },
  { handle: 'koffi.mensah', name: 'Koffi Mensah', country: 'TG', tech: ['spring-boot', 'jpa'] },
  { handle: 'amina.bello', name: 'Amina Bello', country: 'NG', tech: ['python', 'fastapi'] },
]

/** Comptes qui servent aux scénarios de modération. */
export const SPAMMER = {
  handle: 'promo.deals',
  name: 'Promo Deals 2026',
  country: 'CI',
  tech: ['mobile-money'],
}
export const RUDE = {
  handle: 'chinedu.okafor',
  name: 'Chinedu Okafor',
  country: 'NG',
  tech: ['java'],
}

/** Recruteurs : le rôle Recruteur est donné par un administrateur. */
export const RECRUITERS = [
  {
    handle: 'rh.sahelpaiements',
    name: 'Mariam Sanou',
    country: 'SN',
    tech: ['java', 'spring-boot'],
    company: 'Sahel Paiements',
  },
  {
    handle: 'rh.agrilien',
    name: 'Jean-Marc Kouassi',
    country: 'CI',
    tech: ['flutter'],
    company: 'AgriLien',
  },
]

/**
 * Questions : t titre, b détails, tags, ctx contexte africain, code facultatif,
 * a réponses (la première est acceptée par l'auteur de la question).
 */
export const QUESTIONS = [
  {
    t: "L'API Orange Money renvoie 401 alors que le token est généré",
    b: "J'appelle l'API de paiement Orange Money depuis un backend Node.js. Le token OAuth est bien reçu, mais l'appel de paiement répond 401 à chaque fois. Le même token fonctionne dans Postman.",
    tags: ['mobile-money', 'node.js'],
    ctx: {
      countryCode: 'CI',
      mobileMoneyOperator: 'ORANGE_MONEY',
      networkQuality: 'GOOD',
      techVersion: 'Node 20',
    },
    code: 'const res = await fetch(url, { headers: { Authorization: token } })',
    a: [
      "Il manque le préfixe Bearer dans l'en-tête : Authorization doit valoir « Bearer <token> ». Postman l'ajoute tout seul, pas fetch.",
      "Vérifiez aussi que le token n'a pas expiré entre la génération et l'appel : chez Orange il dure environ 5 minutes.",
    ],
  },
  {
    t: 'Webhook Wave Checkout : la signature est refusée en production',
    b: 'En local la vérification de signature du webhook Wave passe, mais en production Spring Boot rejette toutes les notifications. Je lis le corps avec @RequestBody puis je calcule le HMAC.',
    tags: ['spring-boot', 'mobile-money'],
    ctx: {
      countryCode: 'SN',
      mobileMoneyOperator: 'WAVE',
      networkQuality: 'UNSTABLE',
      techVersion: 'Spring Boot 3.3',
    },
    a: [
      'Le HMAC doit être calculé sur le corps brut, octet pour octet. Une fois désérialisé puis resérialisé par Jackson, le JSON change et la signature ne correspond plus. Lisez le corps en byte[] avant tout traitement.',
      'Pensez aussi à comparer les signatures avec MessageDigest.isEqual pour éviter les attaques par temps de réponse.',
    ],
  },
  {
    t: 'Garder une app Flutter utilisable quand la connexion coupe',
    b: 'Mes utilisateurs de Kumasi perdent souvent le réseau en pleine saisie. Je voudrais enregistrer les formulaires en local et les envoyer dès que la connexion revient.',
    tags: ['flutter', 'sqlite'],
    ctx: { countryCode: 'GH', networkQuality: 'VERY_POOR', techVersion: 'Flutter 3.22' },
    a: [
      'Stockez chaque envoi dans une table SQLite « outbox » avec un statut, puis un service écoute connectivity_plus et rejoue la file au retour du réseau. Rendez les requêtes idempotentes avec une clé unique pour éviter les doublons.',
      'Pour du plus simple, drift ou isar gèrent bien le hors ligne. Gardez la file courte et supprimez les envois réussis.',
    ],
  },
  {
    t: 'PostgreSQL dans Docker perd ses données au redémarrage',
    b: "Je lance PostgreSQL avec docker run, je crée des tables, puis après un redémarrage de la machine tout a disparu. Je n'ai pas touché au conteneur.",
    tags: ['docker', 'postgresql'],
    ctx: { countryCode: 'BF', networkQuality: 'GOOD', techVersion: 'PostgreSQL 16' },
    a: [
      'Sans volume, les données vivent dans la couche du conteneur et disparaissent avec lui. Ajoutez -v pgdata:/var/lib/postgresql/data ou un volume nommé dans docker-compose.yml.',
      "Faites aussi une sauvegarde régulière avec pg_dump : un volume ne protège pas d'une suppression par erreur.",
    ],
  },
  {
    t: 'LazyInitializationException sur une relation @OneToMany avec Spring Boot',
    b: "Quand je renvoie mon entité Commande depuis le contrôleur, l'accès à la liste des lignes lève LazyInitializationException. open-in-view est désactivé.",
    tags: ['spring-boot', 'jpa'],
    ctx: { countryCode: 'TG', techVersion: 'Spring Boot 3.2' },
    a: [
      "Ne renvoyez pas l'entité : mappez vers un DTO dans le service, à l'intérieur de la transaction. Pour charger les lignes, utilisez un JOIN FETCH ou @EntityGraph sur la requête.",
      "Laissez open-in-view désactivé, c'est la bonne pratique. L'erreur vient simplement du fait que la session est fermée avant la sérialisation.",
    ],
  },
  {
    t: 'Gérer Wave et Moov Money dans la même application Laravel',
    b: 'Je dois proposer plusieurs opérateurs de paiement. Chacun a son API et ses statuts. Comment structurer le code pour ne pas dupliquer la logique ?',
    tags: ['laravel', 'mobile-money'],
    ctx: {
      countryCode: 'ML',
      mobileMoneyOperator: 'MOOV_MONEY',
      networkQuality: 'UNSTABLE',
      techVersion: 'Laravel 11',
    },
    a: [
      "Définissez une interface PaymentGateway (initiate, status, refund) et une classe par opérateur. Un service résout la bonne implémentation depuis le conteneur selon l'opérateur choisi. Les statuts propres à chaque API sont convertis en un enum commun.",
      'Ajoutez une table payments avec une colonne provider et enregistrez la réponse brute pour le débogage.',
    ],
  },
  {
    t: 'Comment déployer une app Spring Boot sur un VPS à Ouagadougou ?',
    b: "J'ai un petit VPS Ubuntu et un jar Spring Boot. Je voudrais un déploiement simple, avec HTTPS et redémarrage automatique en cas de panne.",
    tags: ['spring-boot', 'devops'],
    ctx: { countryCode: 'BF', networkQuality: 'UNSTABLE', techVersion: 'Java 21' },
    a: [
      'Le plus simple : Docker Compose avec votre jar, PostgreSQL et Caddy devant pour le HTTPS automatique (une ligne dans le Caddyfile). Ajoutez restart: unless-stopped sur chaque service.',
      "Sans Docker, un service systemd avec Restart=on-failure et Nginx en proxy inverse fait très bien l'affaire.",
    ],
  },
  {
    t: 'React Native ou Flutter pour une app de livraison à Abidjan ?',
    b: "Nous sommes deux développeurs, avec des téléphones Android d'entrée de gamme chez les livreurs. Quelle techno choisir pour aller vite et rester léger ?",
    tags: ['flutter', 'react-native'],
    ctx: { countryCode: 'CI', networkQuality: 'UNSTABLE' },
    a: [
      'Pour des Android modestes, Flutter est plus prévisible : un seul moteur de rendu, de bonnes performances sans configuration. React Native convient si vous maîtrisez déjà React. Choisissez selon votre équipe, pas selon la mode.',
      "Quelle que soit la techno, soignez le mode hors ligne et la taille de l'APK : sur 3G, chaque Mo compte.",
    ],
  },
  {
    t: 'Faire marcher une PWA hors ligne avec un service worker',
    b: "Mon site doit afficher les dernières questions consultées sans réseau. J'ai un service worker mais il ne met rien en cache de façon fiable.",
    tags: ['react', 'hors-ligne'],
    ctx: { countryCode: 'MA', networkQuality: 'UNSTABLE', techVersion: 'Workbox 7' },
    a: [
      "Utilisez Workbox avec la stratégie StaleWhileRevalidate pour les appels d'API de lecture, et CacheFirst pour les fichiers statiques. Testez en mode avion dans Chrome Android, pas seulement dans les outils de développement.",
      "N'oubliez pas de versionner le cache pour supprimer l'ancien à chaque déploiement.",
    ],
  },
  {
    t: 'Intégrer M-Pesa Daraja avec Django : STK push sans réponse',
    b: "Le STK push est accepté (ResponseCode 0) mais le client ne reçoit jamais la demande sur son téléphone. Le callback n'est pas appelé non plus.",
    tags: ['python', 'django', 'mpesa'],
    ctx: {
      countryCode: 'KE',
      mobileMoneyOperator: 'MPESA',
      networkQuality: 'GOOD',
      techVersion: 'Django 5',
    },
    a: [
      'Vérifiez que le numéro est au format 2547XXXXXXXX et que le CallBackURL est joignable depuis Internet en HTTPS : en local, utilisez un tunnel. Le mot de passe doit être le base64 de Shortcode+Passkey+Timestamp, avec le même Timestamp que dans la requête.',
      'Sur le bac à sable, seuls les numéros de test de Safaricom reçoivent la demande.',
    ],
  },
  {
    t: 'Limiter le nombre de requêtes par utilisateur avec Redis et Node.js',
    b: 'Je veux limiter les tentatives de connexion à 5 par 15 minutes par adresse email. Quelle structure utiliser dans Redis ?',
    tags: ['node.js', 'redis'],
    ctx: { countryCode: 'SN', techVersion: 'Node 20' },
    a: [
      'Un compteur par clé : INCR login:<email>, et EXPIRE 900 à la première incrémentation. Quand la valeur dépasse 5, refusez avec 429. Faites INCR et EXPIRE dans un script Lua ou une transaction pour éviter une clé sans expiration.',
      'Pour une fenêtre glissante plus précise, utilisez un sorted set avec les horodatages.',
    ],
  },
  {
    t: 'Optimiser une requête PostgreSQL lente sur une table de 2 millions de lignes',
    b: 'Ma recherche de transactions par numéro de téléphone et date prend 8 secondes. Il y a un index sur le numéro mais EXPLAIN montre un Seq Scan.',
    tags: ['postgresql', 'performance'],
    ctx: { countryCode: 'BF', techVersion: 'PostgreSQL 16' },
    code: "SELECT * FROM transactions WHERE phone = '70123456' AND created_at > now() - interval '30 days';",
    a: [
      "Créez un index composite (phone, created_at). Si phone est stocké en texte avec des espaces ou un préfixe, normalisez-le sinon l'index n'est pas utilisé. Lancez ANALYZE ensuite pour que le planificateur ait des statistiques à jour.",
      'Si vous lisez surtout les 30 derniers jours, un index partiel ou un partitionnement par mois aide beaucoup.',
    ],
  },
  {
    t: 'Authentification par session ou par JWT pour une API Spring Boot ?',
    b: "Notre front React et l'API sont servis sur la même adresse. Faut-il quand même passer par des JWT ?",
    tags: ['spring-boot', 'securite'],
    ctx: { countryCode: 'SN', techVersion: 'Spring Security 6' },
    a: [
      "Sur la même adresse, la session par cookie HttpOnly avec jeton CSRF est plus simple et plus sûre : pas de jeton lisible par JavaScript, déconnexion immédiate côté serveur. Les JWT servent surtout quand plusieurs services ou une app mobile doivent partager l'authentification.",
      'Dans les deux cas, ne mettez jamais de secret dans le jeton ni dans le front.',
    ],
  },
  {
    t: 'Afficher des montants en FCFA sans décimales avec Intl.NumberFormat',
    b: 'Mon formatage affiche 5 000,00 XOF alors que je veux « 5 000 F CFA ». Comment configurer Intl.NumberFormat pour le franc CFA ?',
    tags: ['react', 'typescript'],
    ctx: { countryCode: 'SN', techVersion: 'TypeScript 5' },
    a: [
      "Le franc CFA n'a pas de décimales : passez maximumFractionDigits: 0 avec currency 'XOF' et style 'currency'. Pour le libellé « F CFA », remplacez le symbole après formatage avec formatToParts.",
    ],
  },
  {
    t: 'Sauvegarder automatiquement PostgreSQL chaque nuit sur un petit serveur',
    b: 'Je veux une sauvegarde quotidienne de ma base, conservée 7 jours, sans service payant. Quelle approche me conseillez-vous ?',
    tags: ['postgresql', 'devops'],
    ctx: { countryCode: 'BF', networkQuality: 'UNSTABLE' },
    a: [
      "Un script avec pg_dump compressé, lancé par cron à 3 h, qui supprime les fichiers de plus de 7 jours avec find -mtime. Copiez ensuite le fichier sur un autre serveur avec rsync : une sauvegarde sur la même machine ne protège pas d'une panne disque.",
      "Testez la restauration une fois par mois, c'est la seule vraie preuve.",
    ],
  },
  {
    t: 'SQLite ou Hive pour stocker des données hors ligne dans Flutter ?',
    b: 'Je stocke des listes de produits et des commandes en attente. Je me demande si SQLite est trop lourd pour des téléphones modestes.',
    tags: ['flutter', 'sqlite'],
    ctx: { countryCode: 'CI', networkQuality: 'VERY_POOR', techVersion: 'Flutter 3.22' },
    a: [
      'SQLite est léger et très adapté dès que vous avez des relations et des requêtes (commandes, produits). Hive convient pour de simples paires clé valeur ou des préférences. Pour votre cas, SQLite via drift.',
    ],
  },
  {
    t: 'CORS bloque mon front React qui appelle une API Laravel',
    b: "En local, mon appel fetch vers l'API Laravel est bloqué avec « No Access-Control-Allow-Origin header ». Je pensais que le middleware CORS était actif.",
    tags: ['laravel', 'react'],
    ctx: { countryCode: 'ML', techVersion: 'Laravel 11' },
    a: [
      "Vérifiez config/cors.php : paths doit inclure 'api/*' et allowed_origins l'adresse de votre front. En production, servez le front et l'API depuis la même adresse avec un proxy : plus de CORS du tout.",
    ],
  },
  {
    t: 'Tester un service Spring Boot qui appelle une API de paiement externe',
    b: 'Je ne veux pas appeler la vraie API de paiement dans mes tests. Comment simuler ses réponses, y compris les erreurs et les délais ?',
    tags: ['spring-boot', 'tests'],
    ctx: { countryCode: 'SN', techVersion: 'Spring Boot 3.3' },
    a: [
      "Utilisez WireMock : il démarre un faux serveur HTTP dans le test et vous décrivez les réponses, les codes d'erreur et les latences. Pointez l'URL de l'API vers lui dans les propriétés de test.",
      'Pour de la simple isolation, MockRestServiceServer suffit avec RestTemplate.',
    ],
  },
  {
    t: 'Réduire la taille du bundle React pour une connexion 3G',
    b: "Ma page d'accueil pèse 900 Ko compressés. Mon objectif est de rester sous 300 Ko. Par où commencer ?",
    tags: ['react', 'performance'],
    ctx: { countryCode: 'GH', networkQuality: 'VERY_POOR', techVersion: 'Vite 5' },
    a: [
      "Mesurez d'abord avec rollup-plugin-visualizer. Puis découpez les pages avec React.lazy, retirez les bibliothèques lourdes (moment, lodash entier), servez des images WebP à la bonne taille et activez la compression Brotli sur le serveur.",
    ],
  },
  {
    t: "Envoyer des SMS de confirmation à des numéros du Sénégal et de Côte d'Ivoire",
    b: "Quel fournisseur de SMS fiable pour l'Afrique de l'Ouest, avec une API simple et un coût raisonnable ?",
    tags: ['api', 'sms'],
    ctx: { countryCode: 'SN', networkQuality: 'GOOD' },
    a: [
      "Comparez Africa's Talking, Infobip et Twilio sur vos pays précis : la délivrabilité dépend de l'opérateur. Faites un essai avec 50 messages réels avant de choisir, et prévoyez un secours par email.",
    ],
  },
  {
    t: 'Générer un reçu PDF côté serveur avec Python',
    b: "Après un paiement, je veux envoyer un reçu PDF. Quelle bibliothèque utiliser avec FastAPI sans dépendre d'un navigateur sans interface ?",
    tags: ['python', 'fastapi'],
    ctx: { countryCode: 'NG', techVersion: 'Python 3.12' },
    a: [
      'ReportLab est stable et rapide pour des reçus simples. Si vous préférez écrire en HTML et CSS, WeasyPrint le convertit en PDF sans navigateur. Renvoyez le fichier avec un StreamingResponse.',
    ],
  },
  {
    t: 'Comment protéger un formulaire public contre le spam sans CAPTCHA ?',
    b: 'Notre formulaire de contact reçoit des centaines de messages automatiques. Je voudrais éviter un CAPTCHA qui gêne les utilisateurs sur mobile.',
    tags: ['securite', 'laravel'],
    ctx: { countryCode: 'ML', networkQuality: 'UNSTABLE' },
    a: [
      "Combinez un champ piège invisible (honeypot), une limite de débit par adresse IP et un délai minimum entre l'affichage et l'envoi du formulaire. Ces trois mesures bloquent la plupart des robots sans gêner personne.",
    ],
  },
  {
    t: 'Migrer une base MySQL vers PostgreSQL sans interruption longue',
    b: "Notre application Laravel tourne sur MySQL et nous voulons passer à PostgreSQL. La base fait 4 Go. Comment limiter l'arrêt ?",
    tags: ['postgresql', 'laravel'],
    ctx: { countryCode: 'BF', techVersion: 'PostgreSQL 16' },
    a: [
      'Utilisez pgloader pour la copie initiale et testez-la plusieurs fois sur une copie. Le jour J, passez le site en maintenance, rejouez une dernière synchronisation, puis basculez la configuration. Prévoyez un retour arrière.',
      'Vérifiez les différences de types (booléens, dates, sensibilité à la casse) avant de commencer.',
    ],
  },
  {
    t: 'Lire un fichier CSV de 500 Mo sans saturer la mémoire en Java',
    b: 'Mon import de transactions charge tout le fichier en mémoire et plante avec OutOfMemoryError sur un petit serveur.',
    tags: ['java', 'performance'],
    ctx: { countryCode: 'SN', techVersion: 'Java 21' },
    a: [
      'Lisez le fichier ligne par ligne avec un BufferedReader ou Files.lines, et insérez en base par lots de 1 000 avec JdbcTemplate.batchUpdate. La mémoire reste constante quelle que soit la taille du fichier.',
    ],
  },
  {
    t: "Afficher la carte d'un livreur en temps réel sans consommer toute la data",
    b: "L'app mobile de suivi de livraison vide le forfait des clients. Comment réduire la consommation de données ?",
    tags: ['flutter', 'performance'],
    ctx: { countryCode: 'CI', networkQuality: 'VERY_POOR', techVersion: 'Flutter 3.22' },
    a: [
      "Envoyez la position toutes les 10 à 15 secondes plutôt qu'en continu, avec des messages très courts, et utilisez des tuiles de carte vectorielles mises en cache. Ajoutez une option « économie de données » qui espace encore les mises à jour.",
    ],
  },
  {
    t: 'Gérer les fuseaux horaires dans une application utilisée au Kenya et au Ghana',
    b: "Les horaires s'affichent décalés pour certains utilisateurs. Je stocke les dates en heure locale du serveur.",
    tags: ['python', 'django'],
    ctx: { countryCode: 'KE', techVersion: 'Django 5' },
    a: [
      "Stockez toujours en UTC et convertissez à l'affichage selon le fuseau de l'utilisateur. Dans Django, activez USE_TZ = True et utilisez des datetimes avec fuseau. Le Kenya est en UTC+3 et le Ghana en UTC+0, sans changement d'heure.",
    ],
  },
  {
    t: 'Premier déploiement avec GitHub Actions vers un serveur Ubuntu',
    b: "Je voudrais que chaque fusion sur main déploie automatiquement mon application sur mon serveur. Je n'ai jamais configuré de CI.",
    tags: ['devops', 'github-actions'],
    ctx: { countryCode: 'BF', networkQuality: 'GOOD' },
    a: [
      "Créez un workflow qui construit l'application, puis se connecte au serveur en SSH avec une clé stockée dans les secrets du dépôt et lance docker compose pull puis up -d. Utilisez un utilisateur dédié sans droits root, et ne mettez jamais la clé dans le code.",
    ],
  },
  {
    t: "Validation d'un numéro de téléphone mobile au format international",
    b: "Je dois accepter des numéros du Burkina, du Mali et du Sénégal, avec ou sans l'indicatif. Comment les valider proprement ?",
    tags: ['node.js', 'validation'],
    ctx: { countryCode: 'BF', techVersion: 'Node 20' },
    a: [
      "Ne vous fiez pas à une expression régulière maison : utilisez libphonenumber-js avec le pays par défaut de l'utilisateur, puis enregistrez le numéro au format E.164 (+226...). Cela règle les espaces, les zéros et les indicatifs.",
    ],
  },
  {
    t: 'Éviter le double paiement quand le client rafraîchit la page',
    b: "Si un client clique deux fois ou recharge la page après avoir payé, il arrive qu'un paiement soit créé deux fois.",
    tags: ['mobile-money', 'java'],
    ctx: {
      countryCode: 'SN',
      mobileMoneyOperator: 'WAVE',
      networkQuality: 'UNSTABLE',
      techVersion: 'Spring Boot 3.3',
    },
    a: [
      "Rendez la création idempotente : le client génère une clé unique par intention de paiement, le serveur la stocke avec une contrainte d'unicité et renvoie le même résultat si elle revient. Désactivez aussi le bouton après le premier clic.",
    ],
  },
  {
    t: "Quelle différence entre une mission entre pairs et une offre d'emploi ?",
    b: "Je débute et je ne comprends pas dans quel cas publier une mission plutôt qu'une offre. Pouvez-vous m'expliquer ?",
    tags: ['communaute'],
    ctx: { countryCode: 'TG' },
    a: [
      "Une offre est un poste dans une entreprise, validé par l'équipe avant publication. Une mission est un service ponctuel entre membres (dépannage, intégration, revue de code) avec un budget indicatif et un délai : elle est publiée tout de suite.",
    ],
  },
]

/** Offres publiées par les recruteurs : les trois premières seront approuvées, la quatrième refusée. */
export const JOBS = [
  {
    recruiter: 0,
    title: 'Développeur back-end Java et Spring Boot',
    companyName: 'Sahel Paiements',
    companyWebsite: 'https://sahelpaiements.example.com',
    type: 'PERMANENT',
    countryCode: 'SN',
    city: 'Dakar',
    technologies: ['java', 'spring-boot', 'postgresql'],
    description:
      "Rejoignez l'équipe qui construit nos API de paiement mobile utilisées au Sénégal et en Côte d'Ivoire. Vous concevez des services Spring Boot, écrivez des tests d'intégration avec Testcontainers et participez aux revues de code. Une première expérience avec PostgreSQL est un plus.",
    compensation: '900 000 à 1 300 000 F CFA par mois',
    decision: 'APPROVE',
  },
  {
    recruiter: 1,
    title: 'Développeur mobile Flutter',
    companyName: 'AgriLien',
    companyWebsite: 'https://agrilien.example.com',
    type: 'REMOTE',
    countryCode: 'CI',
    city: 'Abidjan',
    technologies: ['flutter', 'dart', 'sqlite'],
    description:
      'AgriLien met en relation des coopératives agricoles et des acheteurs. Vous développez notre application Flutter, pensée pour fonctionner hors ligne dans les zones à faible couverture, et vous travaillez avec une équipe répartie entre Abidjan et Bobo-Dioulasso.',
    compensation: '700 000 à 1 000 000 F CFA par mois',
    decision: 'APPROVE',
  },
  {
    recruiter: 0,
    title: 'Ingénieur DevOps',
    companyName: 'Sahel Paiements',
    companyWebsite: 'https://sahelpaiements.example.com',
    type: 'CONTRACT',
    countryCode: 'SN',
    city: 'Dakar',
    technologies: ['docker', 'devops', 'linux'],
    description:
      'Mission de six mois pour fiabiliser notre chaîne de déploiement : conteneurisation, intégration continue avec GitHub Actions, surveillance et sauvegardes automatiques. Vous travaillez avec Docker Compose et Caddy sur des serveurs Linux.',
    compensation: '1 200 000 F CFA par mois',
    decision: 'APPROVE',
  },
  {
    recruiter: 1,
    title: 'Commercial terrain, vente de crédit téléphonique',
    companyName: 'Télé Plus',
    type: 'PERMANENT',
    countryCode: 'CI',
    city: 'Abidjan',
    technologies: ['vente'],
    description:
      "Poste de commercial pour vendre du crédit téléphonique en porte à porte dans les quartiers de la ville. Aucune compétence en développement n'est demandée, la rémunération se fait à la commission sur chaque recharge vendue chaque jour.",
    decision: 'REJECT',
    reason: "L'offre n'est pas liée au développement logiciel : elle ne correspond pas à Dɛmɛ.",
  },
  {
    recruiter: 1,
    title: 'Stage développeur web de six mois',
    companyName: 'Faso Numérique',
    companyWebsite: 'https://fasonumerique.example.com',
    type: 'INTERNSHIP',
    countryCode: 'BF',
    city: 'Ouagadougou',
    technologies: ['react', 'node.js', 'typescript'],
    description:
      "Stage de six mois dans notre équipe produit à Ouagadougou. Vous participez à la création d'une plateforme de services publics en ligne, de la maquette jusqu'à la mise en production, avec un tuteur qui vous accompagne chaque semaine.",
    compensation: '150 000 F CFA par mois',
  },
  {
    recruiter: 0,
    title: 'Développeur junior, 3 000 euros par semaine, sans expérience',
    companyName: 'Global Remote Jobs',
    type: 'REMOTE',
    technologies: ['web'],
    description:
      "Travail à domicile, aucune expérience requise, gagnez de l'argent rapidement. Des frais d'inscription de 25 000 F CFA sont à régler par Mobile Money avant l'entretien pour garantir votre place dans le programme de formation offerte.",
  },
  {
    recruiter: 1,
    title: 'Intégrateur API Orange Money et Wave',
    companyName: 'Boutik Express',
    companyWebsite: 'https://boutikexpress.example.com',
    type: 'CONTRACT',
    countryCode: 'CI',
    city: 'Abidjan',
    technologies: ['node.js', 'mobile-money', 'api'],
    description:
      "Notre boutique en ligne doit accepter les paiements Orange Money et Wave. Vous intégrez les deux API, gérez les notifications de paiement et les cas d'échec, et documentez le tout pour l'équipe. Mission de trois mois, travail à distance possible.",
    compensation: '2 000 000 F CFA pour la mission',
  },
]

export const MISSIONS = [
  {
    author: 'aminata.diallo',
    title: "Revue de code d'une API Spring Boot de paiement",
    description:
      'Je cherche un regard extérieur sur une API Spring Boot qui gère des paiements Wave : sécurité, gestion des erreurs et tests. Environ 3 000 lignes de code, accès au dépôt GitHub en lecture.',
    kind: 'CODE_REVIEW',
    budget: { amount: 75000, currency: 'XOF' },
    durationDays: 7,
    technologies: ['java', 'spring-boot'],
    countryCode: 'SN',
  },
  {
    author: 'ibrahim.sawadogo',
    title: 'Dépannage : webhook Moov Money qui ne reçoit rien',
    description:
      "Mon application Laravel ne reçoit plus les notifications de paiement Moov Money depuis hier. Les journaux du serveur sont vides. J'ai besoin d'aide pour diagnostiquer en visio.",
    kind: 'TROUBLESHOOTING',
    budget: { amount: 30000, currency: 'XOF' },
    durationDays: 2,
    technologies: ['laravel', 'mobile-money'],
    countryCode: 'BF',
  },
  {
    author: 'kwame.asante',
    title: 'Intégrer M-Pesa dans une application Flutter',
    description:
      "Nous avons une application de livraison à Kumasi et voulons ajouter le paiement mobile. Il faut intégrer l'API côté serveur et le parcours côté Flutter, avec une bonne gestion des échecs réseau.",
    kind: 'INTEGRATION',
    budget: { amount: 600, currency: 'GHS' },
    durationDays: 14,
    technologies: ['flutter', 'mpesa'],
    countryCode: 'GH',
  },
  {
    author: 'grace.njeri',
    title: "Audit de performance d'un site Django lent",
    description:
      "Notre site Django met plus de 6 secondes à afficher la page d'accueil. Nous cherchons quelqu'un pour trouver les requêtes lentes et proposer des corrections concrètes, avec un court rapport.",
    kind: 'OTHER',
    budget: { amount: 40000, currency: 'KES' },
    durationDays: 10,
    technologies: ['python', 'django'],
    countryCode: 'KE',
  },
]

export const PROJECTS = [
  {
    author: 'fatou.ndiaye',
    title: 'Annuaire open source des développeurs africains',
    description:
      "Un annuaire libre et gratuit des développeurs du continent, avec profils, technologies et villes. Nous cherchons des contributeurs front-end et back-end pour construire la première version avant la fin de l'année.",
    type: 'OPEN_SOURCE',
    technologies: ['react', 'typescript', 'node.js'],
    roles: [
      { title: 'Développeur front-end React', technologies: ['react', 'typescript'] },
      { title: 'Développeur back-end Node.js', technologies: ['node.js', 'postgresql'] },
    ],
    githubUrl: 'https://github.com/deme-demo/annuaire-dev-afrique',
  },
  {
    author: 'seydou.ouedraogo',
    title: 'Surveillance simple des serveurs pour petites équipes',
    description:
      "Un outil léger de surveillance qui prévient par SMS ou Telegram quand un service tombe. Pensé pour les petites équipes qui n'ont pas de budget pour une solution payante, et pour des connexions instables.",
    type: 'STARTUP',
    technologies: ['devops', 'docker', 'python'],
    roles: [
      { title: 'Ingénieur DevOps', technologies: ['docker', 'linux'] },
      { title: 'Développeur Python', technologies: ['python'] },
    ],
  },
  {
    author: 'awa.kane',
    title: "Simulateur d'API de paiement mobile pour apprendre",
    description:
      "Un simulateur qui reproduit le comportement des API de paiement mobile (statuts, délais, erreurs, webhooks) pour permettre aux étudiants de s'entraîner sans compte marchand. Projet d'étude ouvert à toutes et tous.",
    type: 'STUDY',
    technologies: ['node.js', 'mobile-money'],
    roles: [{ title: 'Développeur Node.js', technologies: ['node.js'] }],
    githubUrl: 'https://github.com/deme-demo/simulateur-paiement',
  },
]

export const COMMUNITIES = [
  {
    name: 'Sénégal',
    kind: 'COUNTRY',
    countryCode: 'SN',
    description:
      'Les développeurs du Sénégal : entraide, missions et rencontres à Dakar, Thiès et Saint-Louis.',
    rules: ['Restez courtois', 'Une question par fil'],
  },
  {
    name: 'Burkina Faso',
    kind: 'COUNTRY',
    countryCode: 'BF',
    description:
      'La communauté des développeurs burkinabè : questions locales, offres et projets entre pairs.',
    rules: ['Restez courtois', 'Citez vos sources'],
  },
  {
    name: "Côte d'Ivoire",
    kind: 'COUNTRY',
    countryCode: 'CI',
    description:
      "Les développeurs de Côte d'Ivoire : paiement mobile, offres à Abidjan et entraide technique.",
    rules: ['Restez courtois'],
  },
  {
    name: 'Spring Boot',
    kind: 'TECH',
    tag: 'spring-boot',
    description:
      'Tout sur Spring Boot : sécurité, JPA, tests et déploiement, avec le contexte africain en plus.',
    rules: ['Précisez votre version de Spring Boot'],
  },
  {
    name: 'Flutter',
    kind: 'TECH',
    tag: 'flutter',
    description:
      "Applications mobiles Flutter pensées pour le hors ligne et les téléphones d'entrée de gamme.",
    rules: ['Indiquez la version de Flutter'],
  },
]

export const UNUSED_TAGS = ['wave-api', 'orange-money', 'hors-ligne-first']

export const CHALLENGES = [
  {
    title: 'Simuler une API de paiement mobile',
    statement:
      "Construisez une petite API qui simule un paiement mobile : création d'un paiement, passage par les statuts en attente, réussi ou échoué, et notification par webhook. Le code doit être testé et documenté.",
    specifications:
      'Endpoints attendus :\n\n- `POST` /payments crée un paiement\n- `GET` /payments/{id} consulte le statut\n- `POST` /webhooks/test rejoue une notification',
    technologies: ['api', 'node.js', 'java'],
    startOffsetHours: -1,
    durationDays: 7,
  },
  {
    title: 'Tableau de bord météo utilisable hors connexion',
    statement:
      "Réalisez un tableau de bord météo qui reste utilisable sans réseau grâce à un cache local, avec indication claire de l'état de la connexion et de la fraîcheur des données.",
    specifications:
      'Fonctionnalités attendues :\n\n- Affichage des prévisions de la dernière synchronisation\n- Bannière claire quand le réseau est coupé\n- Synchronisation automatique au retour du réseau',
    technologies: ['pwa', 'react'],
    startOffsetHours: 24 * 8,
    durationDays: 7,
  },
]

export const SUBMISSION_REPOS = [
  { handle: 'kwame.asante', repo: 'kwamea/momo-sim' },
  { handle: 'awa.kane', repo: 'awakane/fake-mobile-money' },
  { handle: 'ibrahim.sawadogo', repo: 'isawadogo/pay-simulator' },
  { handle: 'grace.njeri', repo: 'gnjeri/mpesa-like-api' },
  { handle: 'fatou.ndiaye', repo: 'fndiaye/paiement-sandbox' },
  { handle: 'seydou.ouedraogo', repo: 'sougedraogo/payment-mock' },
]

export const SPAM_ANSWERS = [
  "Arrêtez de chercher ! Formation complète Mobile Money à -90 %, lien en bio, offre valable aujourd'hui seulement !!!",
  'Gagnez 500 000 F CFA par semaine sans effort, écrivez-moi sur WhatsApp pour rejoindre le groupe.',
]

export const RUDE_QUESTION = {
  t: 'Pourquoi les développeurs de ce forum sont aussi nuls ?',
  b: "Personne n'est capable de m'expliquer une simple intégration Wave. Vous ne servez à rien, retournez apprendre les bases avant de répondre.",
  tags: ['laravel'],
  ctx: { countryCode: 'NG' },
}

/** Campagnes de test fermé : qui les publie, ce que fait l'équipe, et qui s'inscrit. */
export const PLAYTESTS = [
  {
    owner: 'kwame.asante',
    platform: 'GOOGLE_PLAY',
    appName: 'Tontine Cash',
    packageName: 'gh.tontinecash.app',
    description:
      "Application de tontine numérique pour les groupes d'épargne de Kumasi : cotisations, tours de table et rappels par notification. Nous cherchons des testeurs sur Android d'entrée de gamme pour vérifier le fonctionnement hors ligne.",
    optInUrl: 'https://play.google.com/apps/testing/gh.tontinecash.app',
    testersTarget: 12,
    requiredDays: 14,
    instructions:
      'Créez une tontine de test, invitez un ami et coupez le réseau pour vérifier que la saisie est conservée.',
    testers: [
      'aminata.diallo',
      'fatou.ndiaye',
      'ibrahim.sawadogo',
      'awa.kane',
      'seydou.ouedraogo',
      'grace.njeri',
      'moussa.traore',
      'youssef.benali',
    ],
    declare: 5,
  },
  {
    owner: 'seydou.ouedraogo',
    platform: 'WEB',
    appName: 'Annuaire des développeurs africains',
    description:
      "Version de test du site de l'annuaire open source : recherche par ville et technologie, profils et filtres. Nous voulons des retours sur la lisibilité en 3G et sur le parcours de recherche.",
    optInUrl: 'https://annuaire-dev-afrique.example.com',
    testersTarget: 10,
  },
  {
    owner: 'fatou.ndiaye',
    platform: 'WEB',
    appName: 'Wave Sandbox Dashboard',
    description:
      'Tableau de bord web qui rejoue des paiements Wave de démonstration pour apprendre à gérer les statuts et les webhooks. Les testeurs reçoivent un compte de démonstration.',
    optInUrl: 'https://wave-sandbox.example.com',
    testersTarget: 8,
    decision: 'APPROVE',
    testers: ['kwame.asante', 'awa.kane', 'grace.njeri'],
    declare: 2,
  },
  {
    owner: 'aminata.diallo',
    platform: 'APP_STORE',
    appName: 'Teranga Livraison',
    packageName: 'sn.teranga.livraison',
    description:
      'Application iOS de suivi de livraison à Dakar, pensée pour des connexions instables. Les testeurs reçoivent une invitation TestFlight et suivent un scénario de commande de bout en bout.',
    optInUrl: 'https://testflight.apple.com/join/TERANGA1',
    testersTarget: 10,
    requiredDays: 7,
    instructions: 'Passez une commande de test puis suivez le livreur sur la carte.',
    testers: ['ibrahim.sawadogo', 'fatou.ndiaye'],
    suspend: 'Le lien TestFlight renvoie une erreur : campagne suspendue le temps de le corriger.',
  },
]

/**
 * De quoi regarnir la file de modération pour la démo : tant qu'il y a moins de dossiers à traiter
 * que MIN_OPEN_CASES, le script publie ces contenus et les fait signaler (moins de 5 fois, donc
 * sans masquage automatique), puis ajoute ces offres en attente de validation.
 */
export const MIN_OPEN_CASES = 4
export const MIN_PENDING_JOBS = 3

export const QUEUE_CASES = [
  {
    kind: 'QUESTION',
    author: 'promo.deals',
    title: 'Comptes Mobile Money vérifiés à vendre, contactez-moi sur WhatsApp',
    body: "Je vends des comptes Orange Money et Wave déjà vérifiés, livraison immédiate, paiement d'avance par transfert. Écrivez-moi en privé pour avoir les prix et rejoindre le groupe.",
    tags: ['mobile-money'],
    ctx: { countryCode: 'CI' },
    reason: 'SPAM',
    reports: 3,
    comment: 'Vente de comptes, sans rapport avec le développement.',
  },
  {
    kind: 'ANSWER',
    author: 'chinedu.okafor',
    answer:
      'Tu ne comprends rien à Spring, arrête de poser des questions et va relire la documentation avant de nous faire perdre notre temps.',
    reason: 'OFFENSIVE',
    reports: 2,
    comment: 'Ton agressif envers le membre qui a posé la question.',
  },
  {
    kind: 'MISSION',
    author: 'promo.deals',
    title: 'Copier-coller des annonces sur 200 sites, 2 000 F CFA par jour',
    description:
      'Mission urgente et facile : copier-coller nos annonces sur 200 sites chaque jour. Aucune compétence demandée, paiement à la fin du mois si le travail est jugé satisfaisant par notre équipe.',
    missionKind: 'OTHER',
    budget: { amount: 2000, currency: 'XOF' },
    durationDays: 30,
    technologies: ['web'],
    countryCode: 'CI',
    reason: 'SPAM',
    reports: 3,
    comment: 'Travail non rémunéré de fait, sans lien avec le développement.',
  },
  {
    kind: 'PROJECT',
    author: 'promo.deals',
    title: 'Programme de parrainage Mobile Money, gagnez à chaque inscrit',
    description:
      "Rejoignez notre programme de parrainage : chaque personne inscrite grâce à votre lien vous rapporte de l'argent. Aucune compétence demandée, il suffit de partager notre lien dans vos groupes.",
    type: 'STARTUP',
    technologies: ['mobile-money'],
    roles: [{ title: 'Ambassadeur du programme', technologies: ['mobile-money'] }],
    reason: 'SPAM',
    reports: 2,
    comment: 'Parrainage rémunéré déguisé en projet.',
  },
]

export const QUEUE_JOBS = [
  {
    recruiter: 0,
    title: "Développeur Laravel pour une plateforme de transfert d'argent",
    companyName: 'Sahel Paiements',
    companyWebsite: 'https://sahelpaiements.example.com',
    type: 'PERMANENT',
    countryCode: 'SN',
    city: 'Dakar',
    technologies: ['laravel', 'php', 'mobile-money'],
    description:
      "Nous renforçons l'équipe qui construit notre plateforme de transfert d'argent entre le Sénégal, le Mali et la Côte d'Ivoire. Vous développez des API Laravel, intégrez les opérateurs de paiement mobile et participez à la revue de code. Une première expérience des paiements est un plus.",
    compensation: '800 000 à 1 100 000 F CFA par mois',
  },
  {
    recruiter: 1,
    title: 'Ingénieur QA pour applications mobiles',
    companyName: 'AgriLien',
    companyWebsite: 'https://agrilien.example.com',
    type: 'REMOTE',
    countryCode: 'CI',
    city: 'Abidjan',
    technologies: ['flutter', 'tests'],
    description:
      "AgriLien cherche un ingénieur QA pour tester son application Flutter sur des téléphones Android d'entrée de gamme et en réseau instable. Vous rédigez des scénarios de test, signalez les anomalies et suivez leur correction avec l'équipe de développement.",
    compensation: '600 000 F CFA par mois',
  },
  {
    recruiter: 0,
    title: 'Gagnez 2 000 000 F CFA en 3 jours sans diplôme',
    companyName: 'Fast Cash Africa',
    type: 'REMOTE',
    technologies: ['web'],
    description:
      "Offre exceptionnelle pour travailler depuis chez vous et gagner beaucoup d'argent rapidement. Aucun diplôme n'est demandé. Des frais de dossier de 15 000 F CFA sont à régler par Mobile Money avant de recevoir votre premier contrat de travail.",
  },
]
