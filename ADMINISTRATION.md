# Administration et déploiement Cloudflare

Ce dépôt garde les pages bilingues en HTML/CSS/JavaScript. Cloudflare Pages les construit depuis le dépôt GitHub; une Pages Function intercepte toutes les routes, y compris les fichiers statiques. D1 conserve les réglages, sessions expirables et compteurs de connexion. Le PDF va dans un bucket R2 privé.

## Préparer Cloudflare

1. Dans Cloudflare, crée une base D1 nommée `pm-systems-admin`, puis exécute le contenu de [`schema.sql`](schema.sql) dans la console D1. La visibilité initiale est privée et aucun CV ni lien LinkedIn n’est configuré.
2. Crée un bucket R2 nommé `pm-systems-cv`. Laisse l’accès public désactivé.
3. Dans **Workers & Pages → Create application → Pages → Connect to Git**, relie le dépôt existant `keltonreq2/pm-systems-engineering.github.io` et la branche `main`.
4. Configure le build avec `npm run build` et le dossier de sortie `dist`.
5. Dans les réglages du projet Pages, lie D1 avec le nom de binding `DB` et la base `pm-systems-admin`. Lie R2 avec le nom `CV_BUCKET` et le bucket `pm-systems-cv`. Ajoute les deux bindings dans Production. Ne partage pas le bucket avec le public.
6. Dans **Settings → Variables and Secrets**, ajoute `ADMIN_USERNAME` comme variable `req2`. Crée ensuite les secrets `ADMIN_PASSWORD_HASH` et `SESSION_SECRET` (sans les ajouter au dépôt) :
   - Lance localement `python3 scripts/create_admin_hash.py`. Saisis un nouveau mot de passe que tu n’as pas utilisé auparavant. Le script demande deux fois le mot de passe sans l’afficher et affiche uniquement le hash PBKDF2 à copier comme secret `ADMIN_PASSWORD_HASH`.
   - Génère `SESSION_SECRET` avec `openssl rand -base64 48`, puis colle la sortie directement dans le champ Secret de Cloudflare. Ne l’envoie pas ici et ne la mets pas dans un fichier suivi par Git.
7. Configure et vérifie Production avant d’activer les déploiements Preview. Pour les previews, utilise une base D1 et un bucket distincts, avec une visibilité initiale privée. N’y réutilise pas des ressources contenant un CV réel.

Cloudflare Pages accepte les bindings D1 et R2 dans ses fonctions. L’intégration GitHub déclenche un déploiement à chaque push vers la branche liée. Après le premier déploiement, reporte l’adresse Pages réellement attribuée dans les URL canoniques, `hreflang`, Open Graph et le sitemap si tu souhaites indexer le site. Aucune ressource Cloudflare n’a été créée et aucun déploiement n’a été effectué depuis ce dépôt.

## Ouvrir l’administration

- Connexion : `/admin/login/`
- Tableau de bord : `/admin/` (session valide requise)
- Identifiant initial prévu : `req2`
- La session est conservée dans un cookie `Secure`, `HttpOnly`, `SameSite=Strict`, valable une heure. La base ne conserve que l’empreinte du jeton de session.
- Après cinq échecs dans une fenêtre de quinze minutes, les essais depuis la même adresse source sont suspendus pendant le reste de la fenêtre. Seule une empreinte HMAC de l’adresse est conservée.

Depuis le tableau de bord, tu peux enregistrer une URL de profil `linkedin.com/in/…`, envoyer/remplacer ou supprimer le CV PDF, et rendre le site public ou privé. L’envoi accepte un PDF de 10 Mo maximum. Le CV reste dans R2 et est servi par `/api/cv`; R2 n’est jamais exposé directement. Le lien LinkedIn et les boutons LinkedIn/CV restent visibles quand ils sont vides. Dans ce cas, leur clic affiche un état en français ou en anglais.

## Vérifier avant de remplacer GitHub Pages

Teste le déploiement Cloudflare à son adresse `*.pages.dev` :

1. Avant de te connecter, `/`, `/en/`, `/assets/favicon.svg`, `/robots.txt` et `/api/cv` ne doivent révéler aucun contenu du portfolio. La route `/admin/login/` doit rester disponible.
2. Connecte-toi à `/admin/`, ajoute un profil LinkedIn et un PDF de test, puis passe le site en mode public. Vérifie les deux langues, le lien externe, le téléchargement PDF et l’administration.
3. Repasse en mode privé et demande directement `/`, `/en/`, un fichier d’image, le CSS, le JavaScript, `robots.txt`, `/api/public-config` et `/api/cv`. Tous doivent renvoyer la page privée ou une réponse sans contenu du portfolio. Vérifie que `/admin/login/` et l’administration authentifiée fonctionnent encore.
4. Après cette vérification, désactive la publication GitHub Pages du dépôt, sinon l’ancienne adresse `keltonreq2.github.io/pm-systems-engineering.github.io/` continue de contourner le contrôle Cloudflare.
5. Le dépôt GitHub est actuellement public d’après le contexte du projet. Le mode privé du site ne peut pas cacher le code source, l’historique et les assets accessibles directement dans un dépôt public. Si ceux-ci doivent aussi être confidentiels, rends le dépôt privé après avoir confirmé que Cloudflare conserve son accès GitHub.

Ne considère pas le mode privé comme opérationnel tant que les essais d’accès direct ci-dessus et la désactivation de l’ancien hébergement ne sont pas terminés. La balise `noindex` et `robots.txt` ne constituent pas un contrôle d’accès.

## Limites et coût

- Toutes les routes passent par la Function pour empêcher un accès direct aux fichiers statiques. Chaque requête d’asset compte donc dans le quota Workers; la limite Free documentée est de 100 000 requêtes par jour.
- Le hash de mot de passe utilise PBKDF2-HMAC-SHA-256 avec 600 000 itérations. Workers Free indique une limite de 10 ms CPU par invocation; cette vérification est susceptible de dépasser cette limite. Prévois Workers Paid pour rendre la connexion fiable : Cloudflare indique un minimum de 5 USD/mois, puis des quotas inclus et d’éventuels dépassements. Le paiement n’est pas activé par ce dépôt.
- D1 Free comprend actuellement 5 millions de lignes lues et 100 000 lignes écrites par jour. R2 inclut actuellement 10 Go-mois de stockage, 1 million d’opérations de classe A et 10 millions de classe B par mois; l’egress R2 n’est pas facturé. La Function lit D1 pour contrôler le mode du site à chaque requête et peut donc utiliser ces quotas avec les pages, images et autres assets. Depuis septembre 2026, D1 Free échoue après dépassement des limites quotidiennes; le middleware échoue alors en mode privé.
- Les offres et quotas Cloudflare peuvent évoluer. Vérifie les tarifs actuels avant activation de la facturation : [Pages Functions](https://developers.cloudflare.com/pages/functions/pricing/), [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/) et [R2](https://developers.cloudflare.com/r2/pricing/).
- Le middleware échoue en mode privé si D1 est indisponible ou non initialisée. Le secret et le hash ne sont jamais envoyés au navigateur. Pour changer le mot de passe, regénère le hash sur ta machine et remplace le secret `ADMIN_PASSWORD_HASH` dans Cloudflare.

Références Cloudflare : [middleware Pages](https://developers.cloudflare.com/pages/functions/middleware/), [bindings Pages](https://developers.cloudflare.com/pages/functions/bindings/), [limites Workers](https://developers.cloudflare.com/workers/platform/limits/), [tarification Workers](https://developers.cloudflare.com/workers/platform/pricing/), [intégration Git Pages](https://developers.cloudflare.com/pages/get-started/git-integration/).
