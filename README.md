# Portfolio Patrice Masson

Portfolio statique bilingue (français par défaut, anglais sous `/en/`) destiné à présenter un parcours professionnel en électrotechnique, des études d’ingénieur à l’ENSEEIHT et des projets techniques. Il utilise HTML, CSS et JavaScript natif. Aucun serveur applicatif ni dépendance externe n’est nécessaire.

Les faits du portfolio Portfoliobox ont été complétés par les réponses déjà fournies dans le questionnaire de migration. Les informations encore absentes sont signalées par `[CONTENU À COMPLÉTER]` ou `[CONTENT TO COMPLETE]`, sans supposition. Les aperçus de CV contenant des coordonnées et les médias originaux non sélectionnés restent exclus du dépôt public.

## Structure

```text
.
├── index.html                 # Version française, langue par défaut
├── en/index.html              # Version anglaise
├── css/styles.css             # Présentation commune et règles responsive
├── js/main.js                 # Menu mobile et conservation de l’ancre au changement de langue
├── assets/images/             # Images locales optimisées en WebP
├── assets/favicon.svg         # Icône du site
├── migration-audit.md         # Inventaire et décisions de migration
├── sitemap.xml                # Déclaration des deux versions linguistiques
├── robots.txt
└── .nojekyll                  # Empêche Jekyll de filtrer les fichiers
```

Chaque version est une page sémantique structurée en sections. Les identifiants des sections sont identiques en français et en anglais : le sélecteur `FR | EN` conserve donc la section ouverte lors du changement de langue. Cette architecture évite de multiplier des pages très courtes tout en gardant une correspondance directe. Des pages séparées pourront être ajoutées si le contenu futur le justifie.

## Prévisualiser localement

Depuis la racine du dépôt, lance un serveur statique :

```bash
python -m http.server 8000
```

Ouvre ensuite `http://localhost:8000/` pour le français et `http://localhost:8000/en/` pour l’anglais. Un serveur local est préférable à l’ouverture directe des fichiers, car il reproduit les chemins et les liens utilisés par GitHub Pages.

## Modifier le contenu

- Pour le français, modifie `index.html` ; pour l’anglais, modifie `en/index.html`. Garde les mêmes identifiants `id` de section dans les deux fichiers pour que le sélecteur de langue conserve la position.
- Le texte français est dans les sections `#about`, `#education`, `#skills`, `#projects`, `#experience`, `#goals`, `#international`, `#cv` et `#contact`. Les sections anglaises utilisent les mêmes identifiants.
- Pour ajouter un projet, duplique un `<article class="project-card">` dans la grille `#projects` des deux fichiers. Ajoute le même projet et les mêmes identifiants de sous-section aux deux langues, une image avec un texte `alt` descriptif, puis les détails vérifiés.
- Pour ajouter une image, dépose un fichier optimisé dans `assets/images/`, puis référence-le depuis le HTML. Les chemins de la version anglaise commencent par `../assets/` car elle est dans `/en/`.
- Pour ajouter un document, place uniquement une version dont la publication est souhaitée dans `assets/documents/`, ajoute un lien explicite et vérifie que le fichier ne contient pas de coordonnées privées non destinées au public.
- Pour ajouter une page dédiée, crée les deux fichiers correspondants (par exemple `projects/projet-a/index.html` et `en/projects/project-a/index.html`), ajoute les liens de langue réciproques, puis mets à jour `sitemap.xml` et ce README.
- Modifie les couleurs, espacements et points de rupture dans `css/styles.css`. Le JavaScript du menu et du sélecteur est dans `js/main.js`.
- La liste des éléments à compléter est tenue dans `migration-audit.md`, sous « Éléments à compléter ».

## Git et publication

La branche de publication est `main`, le dossier publié est la racine `/`. GitHub Pages sert directement les fichiers statiques ; aucun workflow GitHub Actions n’est requis.

```bash
git status
git add index.html en/index.html css js assets README.md migration-audit.md robots.txt sitemap.xml
git commit -m "Describe the change"
git push origin main
```

Le dépôt officiel est [`keltonreq2/pm-systems-engineering.github.io`](https://github.com/keltonreq2/pm-systems-engineering.github.io). Le site de projet attendu est `https://keltonreq2.github.io/pm-systems-engineering.github.io/`. GitHub peut mettre quelques minutes à publier un premier déploiement ; il faut confirmer l’URL dans **Settings → Pages**.

## Domaine personnalisé plus tard

Lorsque tu posséderas un nom de domaine, ajoute-le dans **Settings → Pages → Custom domain**. Configure ensuite les enregistrements DNS indiqués par GitHub et ajoute un fichier `CNAME` à la racine contenant uniquement le nom de domaine confirmé. N’ajoute pas de CNAME avant d’avoir acquis le domaine. Après activation, vérifie HTTPS, les URLs canoniques, Open Graph, `robots.txt` et `sitemap.xml`.

## Éléments à compléter

Les marqueurs de contenu incomplet sont listés dans `migration-audit.md`. Ils concernent les détails de trois projets, les niveaux de langue et projets de mobilité à jour, le CV PDF, la vidéo publique, le contact public et l’engagement citoyen. Les diplômes et trois projets ont déjà été complétés à partir du questionnaire. Les coordonnées et documents ne doivent être ajoutés que si leur publication est souhaitée.
