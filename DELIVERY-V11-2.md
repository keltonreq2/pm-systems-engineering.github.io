# PM Systems Engineering — livraison V11.2

## Point de départ et modifications

Base : commit V11.1 `33415d4` du dépôt `keltonreq2/pm-systems-engineering.github.io`. Logo central transparent et Hero V11 inchangés. Les boutons du header, les pages vidéo FR/EN, la gestion R2 privée, l'accès signé partagé avec les CV, le streaming Range, l'administration du pitch, le diagnostic SEO, les codes Google/Bing, les pages vues anonymes et la correction de la lightbox sont ajoutés. Aucun secret Cloudflare n'est modifié.

## Routes nouvelles

| Route | Usage | Accès |
| --- | --- | --- |
| `/pitch/`, `/en/pitch/` | Lecteur HTML5 natif FR/EN | Session du code CV, vérifiée dans le middleware |
| `GET` ou `HEAD /api/pitch/video` | Vidéo R2 avec byte ranges et 206 | Session du code CV, vérifiée avant R2 |
| `GET`, `PUT`, `DELETE /api/admin/pitch` | État, envoi/remplacement, suppression | Session admin ; même origine pour mutation |
| `GET` ou `HEAD /api/admin/pitch/video` | Streaming de prévisualisation | Session admin |
| `/admin/pitch/` | Page de prévisualisation | Session admin |
| `GET`, `PUT /api/admin/seo` | Contrôles techniques, codes de vérification | Session admin ; même origine pour mutation |
| `GET /api/admin/page-views` | Agrégats quotidiens | Session admin |

Clé R2 fixe : `pitch-video.mp4` dans le bucket privé `CV_BUCKET`. Le code CV existant est le seul code utilisé ; la vidéo reste protégée même lorsque les CV sont librement consultables. Les liens protégés ne figurent pas dans le sitemap ; l'accès vidéo et les pages pitch portent `noindex, nofollow`.

## Migration D1

Migration additive, idempotente : `migrations/0010_portfolio_views.sql`. Elle crée `portfolio_page_views(view_date TEXT, page_path TEXT, views INTEGER)` avec clé primaire `(view_date, page_path)`. Son SQL exact figure dans `ADMINISTRATION.md`. Les réglages du pitch et les codes SEO restent dans `settings`. Appliquer la migration sur la base existante avant de déployer le code ; aucune ancienne migration n'est modifiée.

## Confidentialité et diagnostic

Le compteur stocke uniquement la date UTC, la route FR/EN et le nombre agrégé de pages vues. Aucune IP, donnée de navigateur, identité ou cookie analytique n'est conservé. Les robots évidents sont exclus ; les chiffres représentent des pages vues approximatives, pas des personnes uniques. Le diagnostic SEO inspecte les actifs Pages et la configuration, sans promettre l'indexation réelle dans Google ou Bing.

## Vérification et limites

`npm test` : 67 tests réussis, aucun échec. `npm run build` : réussi, dossiers du pitch FR/EN et de la prévisualisation admin présents dans `dist/`. `npm run audit:layout` : réussi aux largeurs 320, 390, 680, 900, 1080, 1440 et 1920 px ; il contrôle statiquement le logo et la structure existante. La revue visuelle dans un navigateur réel connecté au code non publié doit être faite après mise à disposition d'une prévisualisation du commit : le navigateur de cette session a refusé l'accès au fichier local par sa politique de sécurité. Les dimensions de la lightbox et les règles indépendantes des miniatures sont vérifiées dans les tests de code et CSS ; elles ne constituent pas une preuve visuelle de production.

Le ZIP est un instantané des fichiers suivis avec le dossier racine `pm-systems-engineering-v11-2/`. Le bundle Git comprend l'historique complet. Aucun push GitHub ni déploiement Cloudflare n'est lancé.
