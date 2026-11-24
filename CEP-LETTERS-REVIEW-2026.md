# Lettres de motivation dans le CEP · 24 novembre 2026

Le CEP français et anglais propose les lettres ESB et Landsvirkjun auprès des CV. Les boutons principaux téléchargent les versions anglaises ; chaque version française possède un lien distinct, clairement nommé.

## Correspondance des fichiers

| Emplacement | PDF attendu |
| --- | --- |
| ESB · anglais | Patrice_Masson_ESB_Cover_Letter_EN_August_2027.pdf |
| ESB · français | Patrice_Masson_ESB_Lettre_FR_Aout_2027.pdf |
| Landsvirkjun · anglais | Patrice_Masson_Landsvirkjun_Cover_Letter_EN_August_2027.pdf |
| Landsvirkjun · français | Patrice_Masson_Landsvirkjun_Lettre_FR_Aout_2027.pdf |

## Accès et administration

Le code et le cookie signés des CV restent ceux utilisés par les lettres. Aucun deuxième code ou secret n’est créé. Les fichiers sont enregistrés dans le bucket R2 privé existant `CV_BUCKET`, jamais dans Git ni dans `dist/`. Les routes `/api/letters/{employeur-langue}` contrôlent la session côté serveur à chaque requête, y compris HEAD. Elles répondent 401 sans session et utilisent `private, no-store` et `noindex, nofollow`.

Les invitations temporaires limitées aux CV ou au CEP ne donnent pas automatiquement accès aux nouvelles lettres. Dans ce cas, le CEP propose la saisie du même code commun. La désactivation facultative de la protection CV ne rend jamais les lettres publiques. Le mode privé global du site reste prioritaire.

Dans `/admin/`, la section « Lettres de motivation » offre quatre dépôts PDF distincts, leur téléchargement et leur retrait. Chaque écriture exige une session administrateur et la même origine ; le flux multipart est limité à 10 Mio plus son enveloppe. Un code commun doit déjà être configuré. Aucun changement de schéma D1 ou de binding Cloudflare n’est nécessaire.

## Vérifications effectuées avant livraison

- Build et suite de 79 tests : accès unique aux deux CV et aux quatre lettres, refus des URL directes sans session, cookies erronés/expirés/révoqués, protection du mode privé et des invitations limitées.
- Dépôt, remplacement et retrait isolés par employeur/langue ; refus des écritures anonymes, intersites et des fichiers invalides ou trop volumineux.
- Les quatre PDF fournis ont été vérifiés séparément par dépôt/téléchargement dans un environnement isolé, avec égalité des octets et empreintes SHA-256. Aucun PDF de candidature n’est inclus dans cette livraison de code.
- Contrôle navigateur des quatre téléchargements sur ordinateur et dans une fenêtre de 390 px avec des fichiers de test ; affichage français et anglais sans débordement horizontal.
- Audit des quatre PDF : texte et rendu cohérents, aucune instruction suspecte repérée dans les éléments contrôlés. Pièce binaire de provenance C2PA présente ; signature cryptographique non validée.

## Mise en service

Après installation du code, déposer les quatre originaux dans leurs emplacements via l’administration authentifiée. Contrôler ensuite les quatre téléchargements avec le code existant, puis les mêmes URL sans session. Ne jamais copier les PDF dans les assets publics ou le dépôt GitHub.
