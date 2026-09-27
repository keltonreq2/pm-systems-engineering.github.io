# PM Systems Engineering — livraison V10

La V10 prolonge la V9 fonctionnelle du dépôt et conserve son historique Git.

## Nouveautés

- Logo joint affiché en filigrane fixe sur les pages publiques FR et EN. Opacité de 4,5 % sur grand écran et de 3,5 % sur mobile ; l'image blanche se fond dans le décor grâce au mode de fusion `multiply`. Aucun événement de souris n'est intercepté.
- Visionneuse accessible depuis les huit photos : bouton focalisable, dialogue modal, fond sombre, croix, clic hors image et touche Échap. Les trois projets proposent aussi précédent/suivant et les flèches du clavier ; leurs légendes affichées suivent les textes édités.
- Photo originale de Patrice dans l'ouverture d'un rotor sous les boutons LinkedIn et CV de la section Contact, avec texte alternatif et légende bilingues. L'emplacement `contact.rotor` et la légende `contact.rotor_caption` sont modifiables dans l'administration existante.

## Base de données et déploiement

**Aucune nouvelle migration V10** : les tables V9 `media_overrides` et `content_overrides` acceptent le nouvel emplacement et sa légende. Pour une installation initiale, appliquer les migrations historiques dans leur ordre avant de publier une build V10 ; consulter `ADMINISTRATION.md`.

Le ZIP contient le code et les images destinés au site. Le bundle Git contient tout l'historique du dépôt. Aucun CV privé, secret ou média du dossier historique `migration/original-content/` n'est inclus, hormis la photo choisie pour Contact. Aucun push ni déploiement de production n'a été réalisé pour cette livraison.

## Contrôles

- `npm run build` : génération Cloudflare Pages réussie.
- `npm test` : 58 tests réussis, dont interaction de la visionneuse, administration, D1, CV et publications.
- `npm run audit:layout` : contrôle statique FR/EN et tailles de 320 à 1920 px réussi.
- Vérification directe des images sources et du placement dans le HTML FR/EN.
- **Limite du contrôle visuel** : le navigateur distant a refusé `http://localhost:8765/` (`ERR_BLOCKED_BY_CLIENT`). Une inspection réelle du rendu et du dialogue sur téléphone et ordinateur reste à effectuer sur une URL de prévisualisation accessible.
