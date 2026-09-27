# Livraison V9 — PM Systems Engineering

Base exclusive : V8 `1521fd4` sur la branche `main` existante ; tout l’historique Git est conservé. Aucun push GitHub, déploiement Cloudflare, import D1 distant ou modification R2 de production n’a été effectué.

## Résumé

Composition FR/EN plus dense, mobilité en deux colonnes avec résumé par défaut et détails confirmés administrables, langues distinctes, plan à cinq ans avec titres éditables, matrice de cinq compétences avec preuves liées, études de cas structurées, pied de page daté automatiquement. Administration : preuves et visibilité FR/EN, liens recruteur temporaires révocables par portée, historique textuel et restauration, import JSON après analyse et confirmation. Protection CV, médias R2, CEP, messagerie, modes et identité V8 conservés.

## Installation

1. Sauvegarder D1 et R2 selon les procédures habituelles avant toute opération en production.
2. Appliquer la migration V8 si elle ne l’a pas déjà été ; appliquer ensuite exactement `migrations/0009_editorial_access_history.sql` sur D1 Production et toute base Preview distincte.
3. Déployer **sur le projet Cloudflare Pages existant** après contrôles en Preview et revue des fichiers/commits. Aucun secret supplémentaire.
4. Vérifier dans `/admin/` les textes FR/EN, preuves, visibilité, export et restauration ; créer un lien temporaire de test puis le révoquer. Ne transmettre aucun lien de test à un tiers.

## Vérifications et limites

`npm test`, `npm run build`, `npm run audit:layout`, `git diff --check` et contrôles des archives. Le navigateur de cette session ne peut pas ouvrir l’URL locale du site ; aucun audit visuel complet aux sept largeurs n’est revendiqué. Consulter `V9-EDITORIAL-AUDIT.md` et vérifier en Preview réelle les 320/390/680/900/1080/1440/1920 px, notamment le HTML produit par les Pages Functions et les bindings réels D1/R2. Les chiffres CECRL, destination, entreprise et période de mobilité non confirmés restent absents de la partie publiée.

## Hors périmètre facultatif

Pas de statistiques de visiteurs ni de page `/cep` séparée. Le comptage demanderait une architecture supplémentaire et la vue CEP dupliquerait la navigation alors que la section Projet professionnel couvre déjà les besoins immédiats. Aucun service payant ou cookie marketing n’a été ajouté.
