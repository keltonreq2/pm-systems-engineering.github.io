# Audit éditorial et responsive — V8 → V9

Audit de structure du HTML/CSS source, des règles de mise en page et des textes FR/EN. Le code V9 n’a pas été chargé dans un navigateur réel depuis cette session : le navigateur de prévisualisation a refusé l’adresse locale. Les observations visuelles à écran réel ci-dessous restent à valider dans Cloudflare Preview. La commande `npm run audit:layout` contrôle les ancres, les blocs FR/EN et le calcul des largeurs selon les variables CSS ; elle ne mesure pas les retours à la ligne réels ni les captures d’écran.

| Zone | Constat dans V8 | Changement V9 |
| --- | --- | --- |
| Accueil | Grille texte/image déjà équilibrée. | Structure et visuel conservés. |
| Profil | Texte plafonné à 620 px et écart jusqu’à 135 px. | Colonne de texte souple, écart commun, largeur de lecture élargie. |
| Expertise | Liste en deux parties utiles ; paragraphes volontairement courts. | Grille d’origine conservée et matrice liée à des preuves ajoutée après l’expertise. |
| Projets | Copie plafonnée à 500 px à côté des images ; récit réparti dans paragraphes et faits. | Écart commun, copie assouplie, trois études de cas repliables avec contexte, problème, rôle, démarche, essais/résultat ; rubrique contraintes lorsqu’elle est documentée. |
| Parcours | Chronologie limitée à 930 px dans une page de 1 160 px. | Chronologie étendue à la grille commune. |
| Inspection | Grille image/texte adaptée au contenu. | Largeurs narratives harmonisées. |
| Formation et mentors | Blocs structurés déjà remplis. | Structure conservée, rythme vertical commun. |
| Projet professionnel | Trois cartes puis une timeline ; mobilité avec un texte seul dans un bloc pleine largeur quand les détails sont masqués. | Espacement resserré, quatre jalons avec titres, timeline horizontale sur grand écran et verticale sur mobile ; mobilité en deux colonnes avec résumé utile par défaut à droite, détails confirmés à sa place si publiés. |
| Personnalité et langues | `.international-layout` forcé à `display:block` et note limitée à 850 px, laissant environ 310 px inutilisés dans une page de 1 160 px. | Deux colonnes complémentaires : récit personnel à gauche, français/anglais/russe distincts à droite ; aucune certification ou niveau CECRL inventé. |
| Contact | Grille texte/formulaire déjà fonctionnelle. | Structure conservée, justification évitée sur colonnes étroites. |
| Pied de page | Année fixe seule. | Date automatiquement issue des modifications ou de la migration. |

## Largeurs contrôlées par règles CSS

| Fenêtre | Largeur calculée de `.page-shell` | Mobilité et langues | Trajectoire | Contrôle visuel réel |
| ---: | ---: | --- | --- | --- |
| 320 px | 276 px | Une colonne | Verticale | À faire en Preview |
| 390 px | 346 px | Une colonne | Verticale | À faire en Preview |
| 680 px | 636 px | Une colonne | Verticale | À faire en Preview |
| 900 px | 810 px | Une colonne | Deux colonnes | À faire en Preview |
| 1 080 px | 972 px | Deux colonnes | Quatre jalons | À faire en Preview |
| 1 440 px | 1 160 px | Deux colonnes | Quatre jalons | À faire en Preview |
| 1 920 px | 1 160 px | Deux colonnes | Quatre jalons | À faire en Preview |

`--content: 1160px`, `--gutter: clamp(22px, 5vw, 76px)`, et `--gutter: 22px` à 680 px et moins. Les titres utilisent `text-wrap: balance`, sans césure forcée. Les textes de petites colonnes sont alignés à gauche ; les longs paragraphes suffisamment larges peuvent conserver une justification avec césure automatique. Les blocs narratifs utilisent une limite commune de lecture allant jusqu’à 76 caractères environ selon la police et la taille réelle. L’administration conserve des ancres de navigation et replie séparément les cinq compétences et les événements d’historique.

Avant production, parcourir manuellement **les sept largeurs** en Preview avec les deux langues et les états mobilité détaillée visible/masquée, matrice visible/masquée, CV protégés, CEP visible/masqué, texte personnalisé long et administration remplie. Corriger toute césure, débordement, espace inter-mots ou hauteur anormale observée. Le contrôle de ces situations ne peut pas être déclaré réussi depuis le seul audit statique.
