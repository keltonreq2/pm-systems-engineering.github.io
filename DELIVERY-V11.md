# PM Systems Engineering — livraison corrective V11

## Changements

- Titre principal FR : « Ingénierie électrique, systèmes de puissance & protections ». EN : « Electrical Engineering, Power Systems & Protection ».
- Fil conducteur distinct : « Du terrain à l’ingénierie : comprendre, fiabiliser et transmettre. » / « From field experience to engineering: understanding systems, improving reliability and sharing knowledge. » Il est éditable sous `hero.tagline` ; `hero.title` reste éditable indépendamment dans l'administration existante.
- Logo graphique conservé entre marque et navigation, de 92 à 130 px sur desktop, masqué lorsque le menu compact entre en jeu. Filigrane fixe intégralement retiré ; logo Open Graph inchangé.
- Paragraphes narratifs justifiés avec césure automatique à partir de 901 px. Les titres, libellés, cartes courtes et écrans étroits restent alignés à gauche. Mesure commune et espacement des colonnes alignés sur les variables V9.
- Lightbox, photo du rotor, formulaires, accès CV et recruteur, administration, publications, édition, CEP, D1 et R2 maintenus.

## Fichiers modifiés

`index.html`, `en/index.html`, `css/styles.css`, `functions/lib/content-catalog.js` (régénéré), `scripts/audit-v9.mjs`, `tests/v10.test.js`, `tests/v11.test.js`, `README.md`, `ADMINISTRATION.md`, `DELIVERY-V11.md`.

## Base de données et installation

**Aucune migration V11.** La nouvelle clé de contenu `hero.tagline` utilise la table existante `content_overrides`. Une valeur déjà personnalisée dans D1 pour `hero.title` reste prioritaire sur le texte par défaut V11 ; elle peut être restaurée ou modifiée dans l'administration. Les migrations jusqu'à V9 restent nécessaires pour une installation neuve.

## Vérifications

- `npm run build` : réussite.
- `npm test` : 61 tests réussis.
- `npm run audit:layout` : contrôle statique aux largeurs 320, 390, 680, 900, 1080, 1440 et 1920 px. Logo masqué aux quatre premières, 92 px à 1080, 130 px à 1440 et 1920. Mobilité et chronologie conservent leurs colonnes et leurs ancres FR/EN.
- La vérification dans un vrai navigateur local reste indisponible : le navigateur de cette session refuse le serveur local (`ERR_BLOCKED_BY_CLIENT`). Contrôler visuellement le nombre de lignes des H1, le header, la mobilité, Contact et la lightbox sur une prévisualisation accessible avant production.

Le ZIP livre le dépôt sans les sources historiques privées ; le bundle Git contient l'historique complet. Aucun push ni déploiement n'a été lancé.
