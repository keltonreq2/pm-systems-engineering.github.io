# Livraison V8 — PM Systems Engineering

V8 issue du commit V7 `ff6049f6d650ec00cbfe1972cc86da14a3441a26`, sur la branche existante `main`. Historique conservé. Aucun push ni déploiement.

## Contenu

Projet professionnel FR/EN avec trajectoire cinq ans éditable, cible internationale détaillée masquée au départ, scénarios facultatifs ; code CV administrable et contrôlé côté serveur ; sept photos remplaçables dans R2 privé ; PDF CEP avec publication facultative ; tableau de bord, checklist et export de personnalisation. Le style existant, les modes Public/Privé, l’authentification et la messagerie V7 restent présents.

## Installation

1. Appliquer `migrations/0008_career_media_cv.sql` à D1 **avant** de publier le code V8.
2. Relire `ADMINISTRATION.md` pour les requêtes exactes, les trois tables, six paramètres, routes, accès et opérations admin.
3. Intégrer la branche existante et déployer sur le projet Cloudflare Pages actuel selon le flux habituel ; ne pas activer GitHub Pages en parallèle.
4. Dans `/admin/`, définir et activer le code si souhaité, envoyer les CV et le PDF CEP, compléter les deux langues, puis activer les blocs confirmés.

## Contrôles

`npm test` et `npm run build`. Tests d’intégration Node avec D1 SQLite et R2 simulé ; les tests ne constituent pas une preuve de fonctionnement dans le compte Cloudflare de production. Vérifier en Preview les bindings D1/R2, le cookie `Secure` sous HTTPS, l’éditeur, les sept photos, les deux langues, le mode privé et l’affichage réel à 320/390/680/900/1080/1440/1920 px avant production.

## Points à compléter

Destination, organisation, période et statut réellement confirmés ; CV adaptés FR/EN ; lettre de motivation adaptée à la cible ; slides CEP, chiffres sourcés et bibliographie ; LinkedIn. Aucun de ces éléments n’est inventé ou déclaré prêt sans preuve.
