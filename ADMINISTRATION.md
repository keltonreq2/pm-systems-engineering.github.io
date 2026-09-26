# Administration Cloudflare

Cette version met à jour l’application Cloudflare Pages déjà utilisée en production. Elle conserve les fonctions, l’authentification et les bindings v4. Elle ne demande pas de créer une nouvelle application, une nouvelle base ou un nouveau bucket.

## Ressources de production existantes

| Binding | Ressource existante | Usage |
| --- | --- | --- |
| `DB` | D1 `pm-systems-admin` | Réglages, sessions, textes personnalisés, messages et limitations de requêtes |
| `CV_BUCKET` | R2 `pm-systems-cv` (juridiction EU) | Fichiers PDF privés |

Le bucket R2 doit rester privé. Les fonctions servent les PDF après vérification de leur état dans D1; aucun lien public direct vers R2 n’est utilisé.

## Authentification

La version v4 authentifie l’administration avec les variables/secrets déjà configurés dans l’environnement Cloudflare. Cette mise à jour conserve le flux de connexion et les noms de configuration existants. Elle n’utilise pas de hash PBKDF2 comme configuration active et ne nécessite ni nouveau secret ni changement de mot de passe.

Ne remplace pas les valeurs déjà configurées, ne les ajoute pas au dépôt et ne les copie pas dans un fichier de livraison. Les identifiants n’ont pas besoin d’être transmis pour mettre à jour le site.

## Publier une version mise à jour

Le projet existant utilise `main`, `npm run build` et `dist/` comme répertoire de sortie. Après intégration d’une version, le déploiement de production suit la configuration Cloudflare Pages déjà reliée au dépôt. Avant de publier, vérifie le commit et les résultats locaux de `npm test` et `npm run build`.

Cette livraison v7 contient les modifications locales et les archives de code. Elle n’effectue pas de push Git et ne lance pas de déploiement Cloudflare.

### Origine canonique de production

Dans **Settings → Variables and Secrets** du projet Cloudflare Pages, configure la variable publique suivante dans les environnements Production et Preview :

```text
SITE_ORIGIN=https://pm-systems-engineering-github-io.pages.dev
```

Elle définit les URL canoniques, `hreflang`, Open Graph, Twitter Cards, le JSON-LD, `robots.txt` et le sitemap. La même origine stable est utilisée en Preview pour éviter que les URL contenant un identifiant de déploiement deviennent canoniques. Le middleware conserve cette adresse par défaut si la variable est absente ou invalide. Lorsqu’un domaine professionnel sera prêt, seule la valeur de `SITE_ORIGIN` devra être remplacée par son origine HTTPS, sans chemin. Cette variable ne contient aucun secret et ne modifie aucun binding.

## Interface d’administration

- Connexion : `/admin/login/`
- Tableau de bord : `/admin/` après connexion
- Le lien LinkedIn est configuré séparément des deux CV.
- Le CV français et le CV anglais ont chacun leur propre état, taille, prévisualisation, remplacement et suppression.
- L’envoi est limité à 10 Mio par document. La fonction contrôle le type MIME et la signature `%PDF-`, puis stocke le fichier sous une clé fixe privée.
- Le site démarre dans l’état de visibilité déjà enregistré dans D1. Une modification du lien LinkedIn ne change pas la visibilité.

| Langue | Clé D1 | Clé R2 | Route publique | Route admin |
| --- | --- | --- | --- | --- |
| Français | `cv_available` | `cv-pm-systems-engineering.pdf` | `/api/cv` | `/api/admin/cv` |
| Anglais | `cv_en_available` | `cv-pm-systems-engineering-en.pdf` | `/api/cv/en` | `/api/admin/cv/en` |

Le PDF est servi avec un type de contenu PDF, sans mise en cache et avec une consigne `noindex`. Les actions CV restent visibles si aucun document n’est configuré; leur clic indique clairement que le CV concerné n’est pas disponible.

## Mettre à jour D1 pour le CV anglais

Une base D1 de v4 peut ne pas encore contenir la ligne `cv_en_available`. L’API traite une ligne absente comme indisponible. Pour ajouter l’état initial sans remplacer les données existantes, exécute cette requête dans la base existante :

```sql
INSERT INTO settings (key, value, updated_at)
VALUES ('cv_en_available', 'false', unixepoch())
ON CONFLICT(key) DO NOTHING;
```

La requête conserve la valeur française, le lien LinkedIn et l’état Public/Privé déjà enregistrés. `schema.sql` contient également cette insertion idempotente pour les installations neuves; ne réinitialise pas la base de production.

## Vérification après déploiement

1. En mode privé, vérifie que `/`, `/en/`, les images, CSS, JavaScript, `/robots.txt`, `/sitemap.xml`, `/api/public-config`, `/api/cv` et `/api/cv/en` ne révèlent pas de contenu du portfolio. La page de connexion reste accessible et les réponses privées sont marquées `noindex`.
2. Connecte-toi à `/admin/`. Vérifie le lien LinkedIn ainsi que les sections CV français et anglais, chacune avec son état propre.
3. Sans téléverser de document personnel, vérifie que les deux CV indiquent leur indisponibilité. Pour tester les téléversements, utilise des PDF de test non confidentiels. Vérifie que l’ajout ou la suppression d’un CV ne change pas l’autre.
4. Passe le site en mode public et vérifie les pages française et anglaise, les trois actions d’en-tête, le sitemap et le lien canonique sur le domaine de production.
5. Repasse en mode privé et refais le test d’accès direct aux pages, API et ressources.

Le contrôle Public/Privé est appliqué par le middleware aux ressources statiques et API. L’indisponibilité ou l’erreur de D1 échoue en mode privé. La connexion et le changement de mode restent soumis à l’authentification déjà configurée.

## Hébergement et confidentialité

- L’ancien hébergement GitHub Pages doit rester désactivé. Cloudflare Pages doit rester l’unique voie publique de publication afin que le contrôle Public/Privé ne puisse pas être contourné par l’ancien site statique.
- Le mode privé du site ne masque pas le dépôt source. Si le code et l’historique ne doivent pas être accessibles au public, configure le dépôt GitHub comme privé.
- N’ajoute pas de CV, de coordonnées privées, de captures internes ou de données de réglage dans le dépôt public. Les CV restent dans le bucket R2 privé.
- La variable `SITE_ORIGIN` contrôle les métadonnées publiques; elle n’est pas un secret.

L’audit de reprise du contenu de l’ancien portfolio est dans [`CONTENT-MIGRATION-V6.md`](CONTENT-MIGRATION-V6.md). Les éléments absents ou non confirmés y sont signalés plutôt que présentés comme des faits.

## Repères de développement

Depuis la racine du dépôt :

```sh
npm test
npm run build
```

Un serveur statique local ne peut pas valider les Pages Functions, l’authentification ni les liaisons D1/R2. Les vérifications de ces comportements doivent avoir lieu dans un environnement Cloudflare connecté aux ressources appropriées.


## Migration d’une base V6 vers V7

Exécuter **avant le déploiement V7**, dans la base existante `pm-systems-admin`. Aucun nouveau binding, secret, compte ou service de messagerie n’est nécessaire. Les valeurs `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `DB` et `CV_BUCKET` restent celles de V6. `ADMIN_PASSWORD_HASH` n’est pas utilisé par la connexion active.

Depuis le dossier du projet, avec Wrangler déjà connecté à ton compte Cloudflare :

```sh
npx wrangler d1 execute pm-systems-admin --remote --file=migrations/0007_content_messages.sql
```

Autre possibilité : ouvrir la console SQL de la base D1 existante et exécuter exactement :

```sql
-- V6 -> V7: additive and safe to run more than once.
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS contact_messages_newest ON contact_messages(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS contact_messages_unread ON contact_messages(read_at);

CREATE TABLE IF NOT EXISTS content_overrides (
  language TEXT NOT NULL CHECK (language IN ('fr', 'en')),
  content_key TEXT NOT NULL,
  value TEXT NOT NULL CHECK (length(trim(value)) > 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (language, content_key)
);

CREATE TABLE IF NOT EXISTS contact_rate_limits (
  rate_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS contact_rate_limits_expiry ON contact_rate_limits(window_started);

```

Ces instructions ne suppriment aucune table. Elles peuvent être répétées. Les réglages LinkedIn, Public/Privé, CV et les sessions sont conservés ; les PDF restent dans R2. `schema.sql` intègre les mêmes ajouts pour une installation complète, sans réinitialisation. Si l’environnement Preview utilise une autre base, appliquer aussi la migration à cette base avant les essais.

## Édition des contenus V7

Dans `/admin/`, rubrique **05 · Contenus du portfolio** :

1. Choisir **FRANÇAIS** ou **ENGLISH**.
2. Ouvrir l’accordéon de la rubrique voulue.
3. Modifier un champ texte et cliquer sur son bouton **Enregistrer**.
4. Ouvrir **Prévisualiser cette section** ou recharger le portfolio pour voir le résultat.
5. Pour annuler une personnalisation, cliquer **Restaurer le texte par défaut** puis confirmer.

Chaque langue possède 187 champs, couvrant l’accueil, le profil, les expertises, les projets, l’inspection, la formation technique, le parcours, les formations, les mentors, les objectifs, la personnalité, les loisirs et les textes de contact. Les listes existantes s’éditent élément par élément. L’éditeur modifie les textes : il ne crée pas de nouveaux projets, images ou éléments de liste.

Chaque champ conserve une clé stable. D1 utilise le couple `(language, content_key)`, par exemple `fr` + `hero.title` ou `en` + `mentors.mentor_1.role`. Les titres courts acceptent 500 caractères, les textes 5 000 ; les champs vides sont refusés. Des retours à la ligne sont possibles dans les zones multilignes. Le statut indique les modifications non enregistrées et l’enregistrement réussi. Le changement de langue et la fermeture de page préviennent de la présence de changements non enregistrés.

Le HTML FR/EN reste la source des textes par défaut. Le build génère `functions/lib/content-catalog.js` depuis les attributs `data-content-key` du HTML. Le middleware lit les personnalisations D1 à chaque requête de page et utilise **HTMLRewriter en mode texte (`html: false`)**. Aucun HTML saisi n’est interprété ; les balises restent du texte. Les textes modifiés sont présents dans la réponse HTML et ne dépendent pas d’une injection JavaScript tardive. Les réponses restent `no-store` : aucun commit, rebuild ou déploiement n’est nécessaire pour modifier un texte après installation de V7.

Si la table des personnalisations est absente, inaccessible, vide ou si une clé est inconnue, le texte HTML correspondant reste affiché. Si **toute la base D1** est indisponible, la vérification Public/Privé reste prioritaire et le site demeure fermé : il serait dangereux de supposer qu’un site privé est public. Les liens de prévisualisation ouvrent la version enregistrée et respectent également le mode privé.

Les métadonnées SEO, la navigation et les libellés techniques des formulaires restent définis dans le code. Les titres et textes éditables ne modifient pas automatiquement le JSON-LD ou les descriptions Open Graph.

## Messages V7

Le formulaire public FR/EN envoie un nom (120 caractères maximum), une adresse e-mail (254), un sujet (200) et un message (5 000). Il n’accepte aucune pièce jointe. Les requêtes JSON sont limitées à 32 Kio, même sans en-tête `Content-Length`. La validation côté serveur, le contrôle d’origine, le honeypot et la limitation de fréquence sont actifs.

La limite est de **5 tentatives par période de 15 minutes et par identifiant HMAC** ; elle compte aussi les soumissions invalides. Un incrément atomique D1 empêche les envois simultanés de dépasser la limite. L’identifiant est un HMAC de `CF-Connecting-IP` utilisant `SESSION_SECRET`, avec un préfixe propre au contact. L’application ne stocke ni ne journalise l’IP brute. Les compteurs âgés de plus de 24 heures sont purgés lors d’une nouvelle soumission. Sans adresse IP fournie par Cloudflare, le compteur de secours est partagé.

La rubrique **04 · Messages** affiche le nombre de non lus, 20 messages par page et l’ordre du plus récent au plus ancien. Ouvrir un message permet de lire tout son contenu. Les boutons permettent de le marquer lu/non lu et de le supprimer après confirmation. **Répondre par e-mail** ouvre ton logiciel mail ; le portfolio ne transmet pas lui-même d’e-mail et n’envoie pas de notification automatique.

Les messages sont affichés avec `textContent`, jamais avec du HTML utilisateur. Ils restent en D1 jusqu’à suppression par l’administrateur. Une suppression est définitive dans l’application. Le texte du formulaire informe le visiteur de leur utilisation pour traiter sa demande. L’administration est protégée par la session existante ; les nouvelles API vérifient aussi directement la session et les mutations contrôlent l’origine.

## Nouvelles routes V7

| Méthode | Route | Fonction |
| --- | --- | --- |
| POST | `/api/contact` | Valider et stocker un message si le site est public |
| GET | `/api/admin/messages?page=1` | Liste paginée et compteur non lu, session requise |
| PATCH | `/api/admin/messages/:id` | JSON `{"read":true}` ou `{"read":false}`, session requise |
| DELETE | `/api/admin/messages/:id` | Suppression, session requise |
| GET | `/api/admin/content?language=fr` | Champs, valeurs par défaut et personnalisations |
| PUT | `/api/admin/content` | JSON `{"language":"fr","key":"hero.title","value":"Nouveau titre"}` |
| DELETE | `/api/admin/content` | JSON `{"language":"fr","key":"hero.title"}` : restauration |

Ces exemples JSON documentent les API pour la maintenance ; l’interface admin propose uniquement des champs classiques. Aucune édition JSON n’est demandée à l’utilisateur.

## Contrôles après installation V7

- Vérifier `SITE_ORIGIN=https://pm-systems-engineering-github-io.pages.dev` en Production et Preview.
- Vérifier les deux langues et l’alternance blanc / gris / bleu, ainsi que les trois boutons LinkedIn / CV FR / CV EN.
- Modifier un texte FR, le vérifier dans le HTML servi, contrôler que l’anglais reste inchangé puis restaurer le texte.
- Envoyer un message de test dans chaque langue ; contrôler réception, lu/non lu, réponse `mailto:` et suppression.
- Sans session, contrôler que les API admin sont refusées. En mode privé, vérifier les pages, les PDF et le formulaire.
- Contrôler le rendu sur un vrai téléphone et dans les navigateurs habituels, notamment Safari.

Pour les tests automatisés, utiliser Node.js 24 (les nouveaux tests utilisent SQLite intégré à Node). `npm run build` ne nécessite aucune dépendance de production supplémentaire.
