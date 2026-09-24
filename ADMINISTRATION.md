# Administration Cloudflare

Cette version met à jour l’application Cloudflare Pages déjà utilisée en production. Elle conserve les fonctions, l’authentification et les bindings v4. Elle ne demande pas de créer une nouvelle application, une nouvelle base ou un nouveau bucket.

## Ressources de production existantes

| Binding | Ressource existante | Usage |
| --- | --- | --- |
| `DB` | D1 `pm-systems-admin` | Réglages, sessions et limitations de connexion |
| `CV_BUCKET` | R2 `pm-systems-cv` (juridiction EU) | Fichiers PDF privés |

Le bucket R2 doit rester privé. Les fonctions servent les PDF après vérification de leur état dans D1; aucun lien public direct vers R2 n’est utilisé.

## Authentification

La version v4 authentifie l’administration avec les variables/secrets déjà configurés dans l’environnement Cloudflare. Cette mise à jour conserve le flux de connexion et les noms de configuration existants. Elle n’utilise pas de hash PBKDF2 comme configuration active et ne nécessite ni nouveau secret ni changement de mot de passe.

Ne remplace pas les valeurs déjà configurées, ne les ajoute pas au dépôt et ne les copie pas dans un fichier de livraison. Les identifiants n’ont pas besoin d’être transmis pour mettre à jour le site.

## Publier une version mise à jour

Le projet existant utilise `main`, `npm run build` et `dist/` comme répertoire de sortie. Après intégration d’une version, le déploiement de production suit la configuration Cloudflare Pages déjà reliée au dépôt. Avant de publier, vérifie le commit et les résultats locaux de `npm test` et `npm run build`.

Cette livraison v5 contient les modifications locales et les archives de code. Elle n’effectue pas de push Git et ne lance pas de déploiement Cloudflare.

### Origine canonique facultative

Les métadonnées SEO prennent automatiquement l’origine HTTPS de la requête actuelle. Si tu utilises un domaine personnalisé et souhaites l’imposer comme origine canonique, tu peux ajouter `SITE_ORIGIN` comme variable d’environnement publique dans Cloudflare Pages, avec l’origine seule, par exemple `https://portfolio.example` (sans chemin). Cette variable ne contient aucun secret. Si elle est absente, l’hôte de la requête est utilisé. Aucun changement de binding n’est requis.

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

## Repères de développement

Depuis la racine du dépôt :

```sh
npm test
npm run build
```

Un serveur statique local ne peut pas valider les Pages Functions, l’authentification ni les liaisons D1/R2. Les vérifications de ces comportements doivent avoir lieu dans un environnement Cloudflare connecté aux ressources appropriées.
