# PM Systems Engineering

Portfolio statique bilingue consacré aux systèmes électriques, aux protections, au contrôle-commande et à la formation technique. Le français est servi à la racine et l’anglais sous `/en/`. Le site utilise HTML, CSS et JavaScript natif, sans framework ni dépendance distante.

Le portfolio met en avant l’expérience de Patrice Masson dans l’exploitation hydroélectrique, l’inspection électrique et la formation à EDF, ainsi que ses études d’ingénieur 3EA à l’ENSEEIHT. Les contenus décrivent son parcours actuel d’ingénieur en formation et ne le présentent pas comme consultant.

## Structure

```text
.
├── index.html
├── en/index.html
├── css/styles.css
├── js/main.js
├── assets/images/
├── assets/favicon.svg
├── migration-audit.md
├── robots.txt
├── sitemap.xml
└── .nojekyll
```

## Prévisualiser

Depuis la racine du dépôt, lance un serveur statique avec `python -m http.server 8000`, puis ouvre `http://localhost:8000/` et `http://localhost:8000/en/`. Le serveur local permet de vérifier les chemins comme ils sont servis sur GitHub Pages.

## Modifier le portfolio

- Modifie `index.html` pour le français et `en/index.html` pour l’anglais. Garde les mêmes identifiants de section dans les deux fichiers.
- Les styles communs et points de rupture sont dans `css/styles.css`. Le menu mobile et le changement de langue sont dans `js/main.js`.
- Les images du site sont locales dans `assets/images/`. Ajoute un texte alternatif utile à chaque image.
- Pour ajouter une action professionnelle au header, crée un groupe `.header-actions` avec un lien réel portant la classe `.quick-action`. LinkedIn et le CV restent masqués tant qu’une URL exacte et un PDF explicitement destiné à être publié ne sont pas disponibles.
- N’ajoute aucun aperçu de CV contenant des coordonnées privées. Les documents publiés doivent être relus et validés pour diffusion.

## Indexation temporairement désactivée

Les deux pages contiennent actuellement `<meta name="robots" content="noindex, nofollow">`. Le fichier `robots.txt` autorise les robots à lire ces pages afin qu’ils puissent voir la consigne `noindex`; il ne publie pas le sitemap pendant cette phase. Cette consigne limite l’indexation par les moteurs, mais ne protège pas l’accès : toute personne disposant de l’URL peut toujours consulter le site.

Pour lancer officiellement le site :

1. Retire la balise `noindex, nofollow` des deux pages HTML.
2. Ajoute dans `robots.txt` la ligne `Sitemap: https://keltonreq2.github.io/pm-systems-engineering.github.io/sitemap.xml`.
3. Vérifie les titres, descriptions, liens canoniques et le sitemap.
4. Publie les changements, puis demande une nouvelle exploration dans les outils de référencement utilisés.

La désindexation n’est pas instantanée. Une URL déjà connue d’un moteur peut rester dans les résultats jusqu’à sa prochaine exploration.

## Publication GitHub Pages

Le dépôt est `keltonreq2/pm-systems-engineering.github.io`. La branche à publier est `main`, depuis le dossier racine `/`. Le site de projet est prévu à l’adresse `https://keltonreq2.github.io/pm-systems-engineering.github.io/`.

GitHub Pages est configuré dans **Settings → Pages → Build and deployment**. Choisis **Deploy from a branch**, la branche `main` et le dossier `/(root)`. Le fichier `.nojekyll` permet de servir directement le site statique.

## Éléments volontairement absents

Aucun lien LinkedIn fictif, CV, courriel public, vidéo ou texte d’engagement citoyen n’est affiché. Les niveaux linguistiques et les détails d’une mobilité à venir ne sont pas publiés tant qu’ils n’ont pas été confirmés pour diffusion. Les pages ne montrent aucun champ à compléter.
