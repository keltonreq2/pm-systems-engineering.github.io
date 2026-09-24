# PM Systems Engineering

Portfolio bilingue de Patrice Masson sur les systèmes électriques, les protections, le contrôle-commande et la formation technique. Le français est servi à la racine et l’anglais sous `/en/`. Le site utilise HTML, CSS et JavaScript natif.

Le dépôt est relié à la production Cloudflare Pages. Le middleware contrôle le mode public/privé pour les pages, les ressources et les API. D1 conserve les réglages et les sessions d’administration; les deux CV sont conservés dans un bucket R2 privé. Le site public comprend les expériences techniques, les mentors, les objectifs, les centres d’intérêt et les liens professionnels administrables.

## Structure

```text
.
├── index.html, en/index.html # Portfolio français et anglais
├── css/, js/                 # Styles et comportement du site
├── functions/                # Middleware et API Pages
├── admin/                    # Connexion et tableau d’administration
├── schema.sql                # Schéma D1 et réglages initiaux idempotents
├── ADMINISTRATION.md         # Fonctionnement et mise à jour de la production
├── CONTENT-MIGRATION-V6.md   # Audit des contenus de l’ancien ePortfolio
├── assets/images/            # Images locales
├── robots.txt, sitemap.xml   # SEO bilingue, origine résolue à la requête
└── tests/                    # Tests des règles d’accès et API
```

## Prévisualiser et vérifier

```sh
npm test
npm run build
python3 -m http.server 8000
```

Le serveur statique local affiche le contenu, mais n’exécute pas les Pages Functions : les API, l’authentification, D1/R2 et le contrôle Public/Privé doivent être vérifiés sur un déploiement Cloudflare de test ou de production.

## Modifier le portfolio

- Modifie `index.html` en français et `en/index.html` en anglais; conserve les sections équivalentes et leurs identifiants.
- Les styles adaptatifs sont dans `css/styles.css`; le menu, la langue et les liens pilotés par configuration sont dans `js/main.js`.
- Les liens et états des CV sont fournis par `/api/public-config`. Le CV français est servi par `/api/cv`; le CV anglais par `/api/cv/en`.
- Ne publie aucun PDF, lien ou renseignement personnel sans validation. Les PDF administrés restent dans R2 et ne sont jamais exposés par une URL de bucket.

## Administration

L’administration `/admin/` nécessite le déploiement Cloudflare, le binding D1 `DB` et le binding R2 privé `CV_BUCKET`. La configuration déjà utilisée en production est documentée dans [ADMINISTRATION.md](ADMINISTRATION.md). Cette version conserve le mécanisme d’authentification v4 et les bindings existants; ne les recrée pas lors de la mise à jour.

Les paramètres Cloudflare d’authentification restent dans les variables/secrets de l’environnement de production. Aucune valeur secrète ne doit être ajoutée au dépôt, aux fichiers de livraison ou aux messages. Les informations de CV, profil LinkedIn et visibilité du site se modifient dans l’interface d’administration.

## Indexation et URL publique

Les pages publiques n’incluent pas de `noindex`. Les URL canoniques, `hreflang`, Open Graph, Twitter Cards, le JSON-LD, `robots.txt` et le sitemap utilisent l’origine stable configurée dans `SITE_ORIGIN`. Sa valeur de production actuelle est `https://pm-systems-engineering-github-io.pages.dev`; elle ne suit pas les hôtes éphémères des prévisualisations. L’image Open Graph combine le logo fourni, le nom du portfolio et l’identité professionnelle. Le site privé conserve une réponse `noindex` et un corps réduit.

Les images de contenu conservent leur WebP source et proposent des variantes `srcset` afin que le navigateur puisse choisir une largeur adaptée. Les sections longues sont alignées à gauche sur mobile.

## Historique des versions

`migration-audit.md` documente l’origine des contenus et [`CONTENT-MIGRATION-V6.md`](CONTENT-MIGRATION-V6.md) détaille la reprise éditoriale. L’ancien lien GitHub Pages n’est pas la source canonique de cette version; la mise à jour vise l’application Cloudflare existante. Les artefacts v6 n’effectuent ni push Git ni déploiement.
