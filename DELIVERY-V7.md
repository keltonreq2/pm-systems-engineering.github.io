# Livraison V7 — PM Systems Engineering

## Base et périmètre

V7 est construite exclusivement sur la V6 locale fonctionnelle, commit `8b14ddd43f732a855278e3b438cc4ff722354914`. L’historique Git est conservé. Aucun push, déploiement, changement de secret ou accès en écriture aux ressources Cloudflare de production n’a été effectué.

Le design bleu marine / cyan / blanc / gris est conservé, ainsi que Cloudflare Pages, D1 `DB`, R2 `CV_BUCKET`, la connexion existante, les deux CV indépendants, LinkedIn et Public/Privé. L’image Open Graph 1200 × 630 est identique à celle de V6 (comparaison des empreintes SHA-256). La gestion de `SITE_ORIGIN` et les métadonnées sociales sont conservées.

## Changements visibles

- Projets blancs, inspection grise, protections/formation blanches avec cartes claires, parcours bleu marine, mentors dans une vraie section grise autonome, objectifs blancs, personnalité grise et contact bleu marine.
- Mentors sortis structurellement du parcours, dans l’ordre Parcours → Mentors → Objectifs.
- Formation réordonnée : Bac STI Électrotechnique → BTS Électrotechnique → École d’ingénieur – ENSEEIHT. La 2e année et le diplôme en cours sont explicites dans les deux langues. L’expression « Cycle ingénieur » est retirée des pages.
- Personnalité développée en quatre axes : curiosité/apprentissage, adaptation/autonomie, transmission/collectif, rigueur/persévérance, avec des faits déjà connus du parcours.
- Contact bilingue avec nom, e-mail, sujet, message, état d’envoi, succès/erreur et trois liens LinkedIn/CV conservés.
- Correction du débordement de l’en-tête à 320 px, de l’alignement du menu mobile et des marges du contact. L’administration respecte désormais explicitement l’attribut `hidden` des commandes de CV indisponibles.

## Images retirées / remplacées

Audit visuel de toutes les familles d’images WebP publiées en V6 et des photographies originales disponibles, sans réutiliser les CV privés.

| Fichier V6 retiré de la version publiée | Motif | Remplacement |
| --- | --- | --- |
| `assets/images/project-field-inspection.webp` | Personne visible pendant une intervention en équipement professionnel ; retrait selon la demande sur les photographies identifiables au travail | `project-flood-recovery.webp`, vue existante d’équipements de centrale sans personne identifiable, déjà présente dans les archives |
| `assets/images/project-field-inspection-480.webp` | Variante de la même photographie | Même vue technique existante ; dimensions et texte alternatif adaptés |
| `assets/images/profile-field.webp` | Portrait de terrain identifiable en équipement professionnel ; même non utilisé dans la page, il était copié dans la sortie publique | Supprimé des assets, sans remplacement nécessaire |
| `assets/images/project-training.webp` | Personne en tenue professionnelle EDF ; fichier non affiché mais encore livré publiquement | Supprimé des assets, sans remplacement nécessaire |

Sont conservés : dégrilleur, armoire de contrôle-commande, poste, intérieur de centrale, paysages, voyages, randonnée et savate sans tenue EDF. Aucune photo stock et aucune génération d’environnement industriel. Le logo Open Graph reste inchangé.

Les fichiers retirés restent dans les anciens commits du **bundle historique**, conformément à la demande de conserver l’historique. Ils sont absents du ZIP V7 et de la sortie de build actuelle. La suppression n’efface pas d’anciennes versions éventuellement déjà déployées ou mises en cache hors de ce projet local.

## Éditeur de contenus

Rubrique **05 · Contenus du portfolio** : 187 champs français et 187 champs anglais, organisés en accordéons. Inputs et zones de texte classiques, libellés, bouton Enregistrer par champ, état d’enregistrement et bouton de restauration avec confirmation. Les liens ouvrent le portfolio ou la section enregistrée. Les langues restent indépendantes.

Les textes par défaut restent dans les HTML. La table `content_overrides` ne contient que les personnalisations, identifiées par langue et clé stable. Le catalogue de champs est généré au build à partir de ces HTML ; l’API n’accepte que les clés connues et refuse les valeurs vides. Supprimer une personnalisation restaure le défaut V7.

Le middleware applique les textes avec le HTMLRewriter de Cloudflare en mode texte, avant de servir le HTML. Les modifications sont disponibles au prochain chargement sans commit, push ou rebuild. Les retours à la ligne sont affichés par CSS. Aucun contenu utilisateur n’est interprété comme du HTML.

Une erreur de lecture des personnalisations laisse le HTML par défaut. En cas de panne totale de D1, la vérification de visibilité conserve son comportement fermé de V6 : un site privé ne doit pas devenir public parce que sa visibilité ne peut plus être lue.

L’éditeur modifie les textes des éléments existants. L’ajout de projets, de nouvelles images ou de nouveaux éléments de liste reste une modification structurelle. Les métadonnées SEO ne sont pas synchronisées automatiquement avec les textes édités.

## Messagerie

Les messages sont conservés dans D1 et consultables uniquement après connexion. Boîte de réception triée du plus récent au plus ancien, 20 messages par page, compteur non lu, contenu complet, lu/non lu, suppression confirmée et réponse via `mailto:`. Aucun service d’e-mail externe, aucun envoi automatique de notification.

Le serveur contrôle les types et longueurs (nom 120, e-mail 254, sujet 200, message 5 000), l’adresse e-mail, l’origine et la taille réelle de la requête (32 Kio). Honeypot et limite de 5 tentatives par 15 minutes. Le compteur utilise un HMAC avec `SESSION_SECRET`, sans IP brute conservée. L’incrément est atomique, y compris lors de requêtes concurrentes. Les réponses API appropriées sont `no-store`. Les messages sont affichés comme du texte et restent stockés jusqu’à suppression par l’administrateur.

## Migration et routes

Migration additive et idempotente : `migrations/0007_content_messages.sql`, également incluse dans `schema.sql`. Elle crée `contact_messages`, `content_overrides`, `contact_rate_limits` et leurs index sans modifier les données V6.

Depuis le projet, avec la connexion Cloudflare déjà disponible :

```sh
npx wrangler d1 execute pm-systems-admin --remote --file=migrations/0007_content_messages.sql
```

Le SQL exact à copier dans la console D1 est fourni dans `ADMINISTRATION.md`. Aucun nouveau secret ni binding n’est requis.

| Méthode | Route | Accès |
| --- | --- | --- |
| POST | `/api/contact` | Site public, validation et limitation des envois |
| GET | `/api/admin/messages?page=1` | Administrateur |
| PATCH | `/api/admin/messages/:id` | Administrateur, lu/non lu |
| DELETE | `/api/admin/messages/:id` | Administrateur, suppression |
| GET | `/api/admin/content?language=fr` (ou `en`) | Administrateur |
| PUT | `/api/admin/content` | Administrateur, enregistrement d’un champ |
| DELETE | `/api/admin/content` | Administrateur, restauration d’un champ |

## Validation

- `npm test` : **40 tests réussis**, incluant les 24 contrôles V6 et 16 tests V7.
- Tests SQL sur SQLite intégré à Node : migration répétée, conservation des réglages/sessions, textes par défaut, modifications FR/EN, restauration, clés manquantes, valeurs invalides, stockage et pagination des messages, lu/non lu, suppression, sessions et contrôle d’origine.
- Contact : message valide, mauvais e-mail, limite de longueur, corps JSON trop volumineux, honeypot, compteur concurrent et expiration, mode privé.
- Build réussi ; analyse HTML stricte sans erreur sur FR, EN, administration et connexion ; absence de clés dupliquées ou imbriquées ; vérification des fichiers d’images, ancres, liens CV/LinkedIn et métadonnées.
- **Moteur Cloudflare workerd réel en local**, D1 local et Chromium : application et échappement du texte par HTMLRewriter, sauvegarde depuis l’interface, affichage dans le HTML public, indépendance de l’anglais, restauration, formulaire contact jusqu’à D1, lecture du message comme texte, lu/non lu et suppression depuis l’interface.
- **21 combinaisons page/largeur** : FR, EN et administration à 320, 390, 680, 900, 1080, 1440 et 1920 px. Aucune largeur de document supérieure à la fenêtre. Les accordéons de contenu et un message complet sont ouverts pendant le contrôle admin. Menu mobile ouvert/fermé contrôlé également.
- Captures de pages et de sections aux largeurs 390 et 1440, relues visuellement. Contraste des protections et mentors clairs, place de la personnalité, formulaire et marges contrôlés. Aucun événement d’erreur JavaScript durant les parcours testés.

Outils de l’audit local : Node 24, Miniflare 4.20260730.0, workerd 1.20260926.1 (compatibilité 2026-09-24) et Chromium 153. L’audit utilise des données de test uniquement et ne contacte aucune ressource de production. `scripts/verify-v7.mjs` permet de le reproduire avec les dépendances optionnelles externes précisées ci-dessous.

```sh
npm install --prefix /tmp/pm-v7-tools miniflare@4.20260730.0 workerd@1.20260926.1 @sparticuz/chromium@153.0.0 playwright
V7_TOOL_MODULES=/tmp/pm-v7-tools/node_modules \
MINIFLARE_WORKERD_PATH=/tmp/pm-v7-tools/node_modules/workerd/bin/workerd \
node scripts/verify-v7.mjs
```

`V7_CHROMIUM` permet d’utiliser un exécutable Chromium déjà installé (nécessaire dans les environnements où l’extraction automatique échoue) et `V7_PLAYWRIGHT_MODULE` un module Playwright existant. Ces outils ne sont pas des dépendances du site de production. Les preuves de l’audit sont proposées séparément des sources.

## Opérations manuelles et points à valider

1. Appliquer la migration à la base D1 existante avant de déployer V7. Aucun changement des secrets `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` ni de `DB`/`CV_BUCKET`.
2. Conserver `SITE_ORIGIN=https://pm-systems-engineering-github-io.pages.dev` en Production et Preview jusqu’à un futur domaine personnalisé.
3. Après validation, intégrer V7 et publier avec le processus Cloudflare Pages existant (`npm run build`, sortie `dist/`). Rien n’a été publié automatiquement par cette livraison.
4. Contrôler les personnalisations, les messages et les vrais CV/LinkedIn dans l’environnement déployé. Les tests locaux ne remplacent pas la validation des bindings et secrets de production.
5. Relire les textes français/anglais et confirmer que la vue technique retenue pour l’inspection convient. Vérifier sur un téléphone réel et Safari, non exécuté ici.
6. Les noms des mentors restent anonymisés. Les mises à jour ultérieures des textes peuvent être faites dans l’administration.

## Commits locaux V7

- `15f1404` — présentation bilingue, contenus par défaut et photographies.
- `562110a` — édition D1, formulaire et boîte de réception sécurisés.
- Un dernier commit regroupe la documentation et le scénario de contrôle navigateur.

## Fichiers modifiés ou ajoutés

- `ADMINISTRATION.md`
- `DELIVERY-V7.md`
- `README.md`
- `admin/assets/admin.css`
- `admin/assets/content-messages.js`
- `admin/index.html`
- `assets/images/profile-field.webp`
- `assets/images/project-field-inspection-480.webp`
- `assets/images/project-field-inspection.webp`
- `assets/images/project-training.webp`
- `css/styles.css`
- `en/index.html`
- `functions/_middleware.js`
- `functions/api/admin/content.js`
- `functions/api/admin/messages.js`
- `functions/api/admin/messages/[id].js`
- `functions/api/contact.js`
- `functions/lib/content-catalog.js`
- `functions/lib/content.js`
- `functions/lib/request.js`
- `index.html`
- `js/contact.js`
- `migrations/0007_content_messages.sql`
- `schema.sql`
- `scripts/build.mjs`
- `scripts/content-catalog.mjs`
- `scripts/verify-v7.mjs`
- `tests/v7.test.js`


## Documentation technique consultée

[Cloudflare HTMLRewriter — API officielle](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/) : remplacement par `setInnerContent(..., { html: false })` pour traiter les personnalisations comme du texte échappé.
