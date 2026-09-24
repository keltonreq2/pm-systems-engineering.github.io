# Audit de migration des contenus — V6

## Sources examinées

La V6 part de la V5 fournie : commit `546539a` et ses fichiers de site. L’ancienne adresse Portfoliobox et `/mes-objectifs` n’étaient pas accessibles lors de la consultation web. Une archive locale de contenu, présente dans le dossier privé `migration/original-content/`, conserve toutefois un instantané structuré des pages `/bienvenue`, `/parcours-pro`, `/mes-objectifs`, `/mes-realisations` et `/engagements`. Elle a servi à l’audit; ses images de CV et ses coordonnées personnelles n’ont pas été ajoutées au site ni aux livrables.

La capture jointe confirme la section des mentors et leurs fonctions. Aucun nom propre n’a été ajouté.

| Conservé | Réécrit / intégré | Non retenu |
| --- | --- | --- |
| Les trois fonctions des mentors et leur contribution au développement professionnel. | Création d’une section « Mes mentors » bilingue, sans portraits, noms ni forme de témoignage client. | Ancienne formulation en anglais reprise mot à mot; citations entre guillemets ou approbations attribuées aux mentors. |
| Les trois horizons d’objectifs : formation, élargissement des responsabilités, ambition à long terme. | Objectifs remis à jour pour 2026–2028, puis moyen et long terme; conseil/expertise présenté comme une possibilité future seulement. | Objectifs datés 2025–2026, niveaux de langue chiffrés et ambition de cybersécurité ou de transition énergétique qui n’est pas confirmée pour cette publication. |
| Inspection et dépannage sur centrales et postes, période 2013–2022, diagnostics, contrôles de protections, astreinte et recommandations. | Chapitre bilingue développé autour du contexte, de la démarche d’analyse et des acquis de terrain. La séquence de diagnostic décrit une méthode générale, sans ajouter d’incident ni de résultat chiffré. | La période 2013–2025 de l’archive, qui contredit la période 2013–2022 validée dans la V5; statistiques et responsabilités anciennes sans justificatif indépendant. |
| Formation technique et protections à l’EDF UFPI, période actuelle 2022–aujourd’hui, déjà présente dans la V5. | Chapitre bilingue qui met en regard expertise technique et transmission : HTA/HTB, relais numériques, SEPAM, réglages/essais, contrôle-commande et conception d’exercices. | Ancienne borne « 2022–2025 » et résultats d’apprentissage présentés comme mesurés sans source vérifiée. Aucun schéma interne, réglage ou nom de chantier récent n’est publié. |
| Valeurs anciennes cohérentes avec le parcours : rigueur, sécurité, transmission et coopération. | Intégration dans la personnalité par des exemples du parcours plutôt que par une liste d’adjectifs. | Formules absolues et déclarations institutionnelles génériques non nécessaires au portfolio. Aucun contenu distinct d’engagement citoyen n’a été trouvé dans l’instantané. |
| Savate pratiquée depuis 2007, voyages, marche/montagne et intérêt pour les langues. | Présentation sobre de ce que ces pratiques apportent : régularité, précision, observation et ouverture. | Niveaux de langue, pays visités ou expérience internationale présentée comme acquise sans confirmation. |
| Parcours général EDF Hydro, inspection électrique/protections, UFPI et études ENSEEIHT. | Statut rendu explicite : élève ingénieur en 2e année, Énergie, Électronique et Automatique (3EA), diplôme en cours. | Formulations pouvant laisser croire que le diplôme d’ingénieur est déjà obtenu. |
| Les projets historiques déjà sélectionnés et décrits dans la V5. | Aucune modification de fond des trois projets anciens; ajout d’un aperçu générique et anonymisé de l’activité technique actuelle. | Aucun projet 2024–2026 précis : les éléments disponibles ne permettent pas d’en publier un sans risque de divulgation ou d’affirmation non vérifiée. |
| Le site n’affichait pas d’adresse de contact publique vérifiée. | Section de contact sans formulaire ni courriel, avec LinkedIn et les deux actions CV déjà administrables. | Adresses et numéros visibles dans des aperçus d’anciens CV; toute future adresse publique reste à valider. |

## Points à confirmer avant publication

- Confirmer que les trois intitulés de fonctions des mentors peuvent être publiés tels quels. Les noms restent volontairement absents.
- Confirmer le libellé « élève ingénieur en 2e année » pour l’année scolaire 2026–2027.
- Confirmer si une expérience internationale est effectivement programmée; la V6 n’en annonce aucune comme acquise ou réservée.
- Confirmer toute réalisation technique 2024–2026 diffusable après anonymisation. En attendant, seule une description générale de l’activité actuelle est utilisée.
- Vérifier que l’origine stable `https://pm-systems-engineering-github-io.pages.dev` correspond bien au site de production avant le déploiement. Elle est configurée par `SITE_ORIGIN` et peut ensuite être remplacée par le domaine professionnel.
- Renseigner LinkedIn dans l’administration si le lien doit apparaître dans le site et dans `sameAs` du JSON-LD.

## Consigne de confidentialité

Le dossier d’archive original peut contenir des CV, coordonnées et médias privés. Ne pas l’ajouter aux commits, au ZIP public ni au bundle Git. Le site ne doit inclure que les documents téléversés séparément dans le bucket R2 privé par l’administration.
