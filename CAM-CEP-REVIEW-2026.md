# Préparation CAM — revue des modifications CEP

Présentation : **1er décembre 2026**. Version définitive souhaitée : **27 novembre 2026**.

Base : dernière version du dépôt `keltonreq2/pm-systems-engineering.github.io`, commit `a4b273a8b4d171279916c09ec38561caf2d3bea1`.
Branche de préparation : `cam-cep-review-2026-11-27`. La publication sur le dépôt relié à Cloudflare installe le code et prépare automatiquement les textes lors de la première ouverture publique.

## Modifications

- L’entrée « Pitch » devient **CEP** dans les deux langues. Les anciennes adresses des pages Pitch redirigent vers le CEP après autorisation ; l’ancienne page d’administration redirige vers la rubrique CEP.
- Les pages `/cep/` et `/en/cep/` regroupent **Présentation CEP – CAM**, **CV FR**, **CV EN** et **LinkedIn**.
- Le code et la session des documents sont réutilisés : validation par `/api/cv/unlock`, cookie signé existant, expiration de deux heures, révocation et protection contre les tentatives répétées. Aucun code n’est inscrit dans le HTML ou dans le JavaScript.
- La page et les octets du diaporama sont refusés sans autorisation. La protection du CEP reste obligatoire même si la protection des CV est désactivée. Les accès temporaires existants restent limités à leurs documents autorisés.
- L’administration reçoit et remplace un PDF ou un PPTX de 10 Mio maximum, affiche son nom et son format et permet sa prévisualisation ou son téléchargement et sa suppression. Un seul diaporama est actif. Passer du PDF au PPTX, ou inversement, retire l’ancien fichier après la mise à jour.
- Le PDF s’ouvre avec une option de téléchargement. Le PPTX est proposé en téléchargement, sans dépendre d’une visionneuse externe.
- Extension, type MIME et signature PDF ou structure PPTX sont contrôlés côté serveur. Le PPTX est limité à cinq diapositives. Pour un PDF, le maximum de cinq pages doit être vérifié manuellement : le site ne contient pas de moteur d’analyse PDF.
- Aucun diaporama définitif ni document de substitution n’a été ajouté au site. Les deux petits PPTX de tests restent dans `tests/fixtures/` ; le build ne les copie pas dans les fichiers publics.
- Les CV et le lien LinkedIn utilisent les adresses et réglages existants. Le CEP n’affiche aucune URL LinkedIn provisoire.
- La mobilité est réécrite en FR et EN : activité en 2026, quatre semaines visées en août 2027, Irlande/Norvège/Islande étudiées, candidatures en Irlande, autres pistes à explorer, accueil et modalités à confirmer.
- La frise couvre **2026, août 2027, 2028, 2029–2031**. Le diplôme et l’évolution professionnelle restent présentés comme des objectifs.
- Le paragraphe sur l’apprentissage relie la mobilité aux méthodes d’ingénierie, aux systèmes électriques, à l’anglais professionnel et à la réutilisation des acquis dans les formations et projets.

## Textes déjà personnalisés dans l’administration

Le HTML de secours et le catalogue des champs éditables sont mis à jour. La migration **`migrations/0011_cep_cam_2026.sql`** prépare aussi la mise à jour des champs de projet/mobilité déjà enregistrés dans D1, qui primeraient autrement sur le nouveau HTML.

La version actuelle installe automatiquement ces textes à la première ouverture d’une page publique, via `functions/lib/cam-migration.js`. Un lot transactionnel D1 met à jour seulement les champs CAM concernés et la protection CEP, puis enregistre le marqueur privé `cam_2026_cep_applied`. Les requêtes suivantes ne réappliquent pas les textes : les futures retouches dans l’administration sont conservées. Les conditions SQL empêchent aussi une seconde requête simultanée de rejouer la mise à jour.

Aucune manipulation manuelle de D1 n’est nécessaire. Le fichier SQL reste disponible comme solution manuelle ; il ne faut pas le réexécuter après de futures retouches éditoriales. Aucun changement de secret ou de liaison de stockage n’est requis. Les CV, LinkedIn, le code d’accès, les messages et les médias existants sont conservés.

## Vérifications

- **Build : réussi** (`npm run build`).
- **72 tests réussis**, y compris les tests existants et cinq scénarios CEP supplémentaires.
- Dépôt PDF, remplacement PDF, dépôt PPTX, remplacement PPTX, remplacement entre formats, suppression et compatibilité des anciens PDF.
- Ouverture PDF et téléchargement forcé ; type MIME, extension et contenu exact du téléchargement PPTX.
- Code commun au CEP et aux deux CV ; refus sans code ou avec code erroné ; expiration, changement de code et révocation.
- Protection des adresses directes FR/EN et des variantes de chemin, y compris les chemins encodés et sans extension ; absence de réponse HTML privée avant autorisation.
- Refus des fichiers invalides, des PPTX de six diapositives, des tailles excessives, des mutations sans session administrateur ou depuis une autre origine.
- Installation automatique testée avec une transaction interrompue, une nouvelle tentative et la conservation d’une retouche ultérieure ; migration vérifiée dans une base locale : les champs non concernés et le lien LinkedIn restent intacts ; aucun accueil international n’est déclaré confirmé.
- Contrôle visuel local : bouton CEP et dialogue de code sur ordinateur ; page CEP et sections FR/EN dans des vues de 390 px ; aucune largeur de contenu supérieure à la vue inspectée. La frise devient verticale sur mobile.
- La prévisualisation utilise une base et un stockage locaux isolés. Les contrôles d’accès et opérations sur fichiers ont été exécutés par les tests des vrais gestionnaires de l’application. Le moteur HTMLRewriter de Cloudflare et une mise en production complète n’ont pas été exécutés dans ce navigateur local.

## Liens et contenus existants : portée de la vérification

La configuration du site actuel indique que les deux CV sont disponibles et protégés. Les deux routes publiques de CV renvoient **401 sans code**, conformément à cette protection. Les fichiers privés de production n’ont pas été téléchargés ou remplacés : leur version et leur contenu n’ont pas été relus.

Le lien configuré est `https://www.linkedin.com/in/patrice-m-893633210`. Il est réutilisé. LinkedIn a renvoyé un refus de consultation automatique (999) : l’actualité du profil ne peut donc pas être certifiée depuis cet environnement.

## À fournir ou valider avant le 27 novembre

1. Le diaporama définitif de **cinq diapositives maximum**, en PDF ou PPTX. Un PDF est recommandé pour l’ouverture immédiate dans le navigateur.
2. Confirmer que les CV déjà enregistrés et le profil LinkedIn reflètent bien la situation actuelle ; les remplacer ou les actualiser si nécessaire.
3. Relire cette version, puis décider de sa publication. Après publication et installation automatique des textes, déposer le diaporama dans **Administration → Projet professionnel / CEP**, puis activer sa disponibilité dans le CEP.

## Audit préalable des deux documents disponibles

**Statut : aucune instruction suspecte détectée dans les éléments inspectés ; vérification visuelle incomplète.** Les documents disponibles sont la grille de revue de presse et le support de la session 5, pas les dernières consignes CEP ni la capture mentionnée dans la demande.

Inspection effectuée : extraction des textes des 14 pages, traces de texte (taille, opacité, couleur et position), métadonnées, catalogue PDF, annotations, liens, calques et fichiers incorporés ; rendu et inspection visuelle de la première page de chacun des deux documents.

Les titres blancs du support et deux espaces de petite taille dans la grille correspondent à la mise en page ; aucune instruction cachée suspecte n’a été trouvée. Aucun mécanisme de manipulation ni risque particulier sur cette modification n’a été identifié. Confiance **moyenne** : toutes les pages n’ont pas fait l’objet d’une comparaison visuelle exhaustive, les images n’ont pas toutes été soumises à une recherche OCR indépendante et l’ensemble des objets PDF n’a pas été analysé manuellement.

Les cinq diapositives maximum et les échéances de cette livraison proviennent de la demande explicite de l’utilisateur.
