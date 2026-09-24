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
├── functions/              # Pages middleware and admin APIs
├── admin/                  # Login and administration UI
├── schema.sql              # D1 tables with private initial state
├── ADMINISTRATION.md       # Cloudflare setup and privacy verification
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
- Les boutons LinkedIn et CV restent toujours visibles. Leur destination vient de `/api/public-config`; tant qu’elle est vide, un message indique que le lien ou le PDF n’est pas disponible.
- N’ajoute aucun aperçu de CV contenant des coordonnées privées. Les documents publiés doivent être relus et validés pour diffusion.

## Administration

L’outil `/admin/` nécessite Cloudflare Pages Functions, D1 et un bucket R2 privé. Il ne fonctionne pas sur le déploiement statique GitHub Pages existant. Suis [ADMINISTRATION.md](ADMINISTRATION.md) pour relier ces services, créer les secrets dans le tableau de bord Cloudflare, déployer et vérifier le mode privé. La base démarre en mode privé. Aucun mot de passe, hash, jeton ou identifiant de service ne doit être ajouté au dépôt.

Exécute `npm test` pour les tests et `npm run build` pour produire le dossier Cloudflare Pages `dist/`.

## Indexation temporairement désactivée

Les deux pages contiennent actuellement `<meta name="robots" content="noindex, nofollow">`. Le fichier `robots.txt` autorise les robots à lire ces pages afin qu’ils puissent voir la consigne `noindex`; il ne publie pas le sitemap pendant cette phase. Cette consigne limite l’indexation par les moteurs, mais ne protège pas à elle seule les fichiers servis par GitHub Pages. Le contrôle d’accès dépendra du déploiement Cloudflare décrit dans [ADMINISTRATION.md](ADMINISTRATION.md).

Pour lancer officiellement le site :

1. Retire la balise `noindex, nofollow` des deux pages HTML.
2. Après avoir choisi l’adresse Cloudflare de production, adapte les URL canoniques, `hreflang`, Open Graph et le sitemap à cette adresse.
3. Vérifie les titres, descriptions, liens canoniques et le sitemap.
4. Publie les changements, puis demande une nouvelle exploration dans les outils de référencement utilisés.

La désindexation n’est pas instantanée. Une URL déjà connue d’un moteur peut rester dans les résultats jusqu’à sa prochaine exploration.

## Hébergement existant et migration

Le dépôt existant est `keltonreq2/pm-systems-engineering.github.io`; son site GitHub Pages est actuellement en ligne à `https://keltonreq2.github.io/pm-systems-engineering.github.io/`. GitHub Pages sert les fichiers statiques mais ne lance pas les Functions d’administration et ne protège pas les ressources.

Le nouveau build Cloudflare utilise la branche `main`, la commande `npm run build` et `dist/` comme dossier de sortie. L’ancienne publication GitHub Pages doit rester active jusqu’à la fin des tests Cloudflare, puis être désactivée. Un dépôt GitHub public expose toujours son code source et ses assets même si Cloudflare masque les pages; rends le dépôt privé si ceux-ci doivent être confidentiels.

## Éléments volontairement absents

Aucun lien LinkedIn fictif, CV, courriel public, vidéo ou texte d’engagement citoyen n’est affiché. Les liens LinkedIn/CV sont pilotés par l’administration; aucun profil ou document n’est prérempli. Les niveaux linguistiques et les détails d’une mobilité à venir ne sont pas publiés tant qu’ils n’ont pas été confirmés pour diffusion.
