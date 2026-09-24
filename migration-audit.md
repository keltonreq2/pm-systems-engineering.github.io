# Portfolio migration audit

**Source:** [pmelectricalengineer.portfoliobox.net](https://pmelectricalengineer.portfoliobox.net)  
**Content snapshot date:** 24 September 2026  
**Source language:** English  
**Audit scope:** published page data, navigation labels, text, image references and links embedded in the public page. The rendered Portfoliobox interface could not be inspected interactively in this environment, so exact visual behaviour and mobile menu behaviour are not claimed as verified.

## 1. Existing structure

The published page data exposed five pages. The home page contained the site navigation labels; the page titles and paths were:

| Existing page | Path | Main content |
| --- | --- | --- |
| Welcome / Home | `/bienvenue` | Introduction, professional pitch, navigation cards and three mentor profiles |
| Professional journey | `/parcours-pro` | Four career milestones, soft skills and five CV-related images |
| Achievements | `/mes-realisations` | Introductory text and six technical projects plus a 2025 closing image/text |
| Objectives | `/mes-objectifs` | Short-, medium- and long-term objectives plus six academic and technical learning goals |
| Commitments | `/engagements` | Values, Ingé+ participation, international mobility and three personal interests |

The home-page menu labels were “Home”, “My backyard” (the label in the source), “My technical projects”, “My Objectives” and “About me”. The content preview under “About me” also mentioned “My civic engagements”, but there was no corresponding published section or text in the extracted page data. There was no dedicated contact page, education page or skills page.

## 2. Content recovered

The original text snapshot and media inventory were saved separately from the public site. The snapshot preserves the page order, page text, list/card content, image captions, original media URLs and internal menu paths while excluding Portfoliobox view templates and styling data.

Recovered content includes:

- **Profile:** Patrice Masson; engineer in training at ENSEEIHT, 3EA department; electrotechnical professional at EDF; source portfolio states more than 15 years of experience.
- **Education and Ingé+:** Energy, Electronics and Automation; coursework named in the source includes mathematics, operational amplifiers, filters, signal processing and electronics. The source describes combining studies with EDF duties and supporting collective projects and fellow students. The user’s completion sheet adds a Bac STI in electrotechnics, a BTS in electrotechnics from Pôle Formation UIMM Beauzelle (2012), and H2B2, HCBC and TSTBT authorisations; validity dates were not supplied.
- **Career:** EDF Hydro operations technician (2010–2013); electrical inspector in EDF/Enedis work (2013–2022, with transition to Enedis in 2017); EDF UFPI technical trainer and protection systems lead (2022–2025); ENSEEIHT studies alongside EDF responsibilities (2025 onward).
- **Technical knowledge:** MV/HV systems, hydroelectric systems, protection relays and SEPAM, settings, fault analysis, relay tests, trip logic, schematics, control-command and modernization.
- **Professional practice:** problem solving, collaboration and communication, pedagogy, leadership and decision-making, technical rigor, adaptability, resilience and stress management.
- **Objectives:** three time horizons (2025–2026, 2026–2028 and 2028 onward) and six learning goals including English C1, Russian A2, MATLAB and C, core engineering subjects, analytical problem-solving and professional posture.
- **Values and personal interests:** seven commitments, Savate (the source states since 2007), travel, hiking and mountaineering.
- **Mentors:** three anonymised professional-role descriptions, retained without inventing names.
- **Projects:** six technical project cards and their source-stated context, role, objectives and reported outcomes, plus the source’s 2025 “job well done” closing text.

### Recovered technical projects

| Date | Project and location | Source-stated contribution or result |
| --- | --- | --- |
| 2011–2012 | Hydromechanical screen modernization, Palaminy Hydropower Plant | On-site project lead for design, wiring and commissioning; in-house control-command refurbishment; improved safety and reduced maintenance costs. |
| 2013–2014 | Control-command refurbishment, Fos Hydropower Plant | Removal, rewiring and functional testing; migration to a modern architecture; source reports “+30% reliability” and improved maintainability. |
| 2014 | Restoration after major flooding, Fos Hydropower Plant | Testing and requalification of generating units; source states 100% of the plant was restored and functional. |
| 2021 | Digital control-command transition, Palaminy HV/MV substation | Electrical testing and commissioning; improved reliability of a critical network link. |
| 2013–2025 | Field inspection and troubleshooting, Southwest France | Diagnostics, 24/7 on-call troubleshooting and technical recommendations; action plans integrated into maintenance and improvement strategies. |
| 2022–2025 | Protection systems expertise and training, EDF Toulouse campus | Technical trainer and pedagogical lead; practical simulations and training; improved technician understanding, autonomy and safety awareness. |

### Additional information supplied in the completion sheet

The questionnaire adds project detail for the Palaminy screen project (operations-team integration, specification through handover, SEE Electrical and Unity Pro, and an operational control-command system), the Fos control-command project (shutdown after flooding, moisture damage, work with an electrician, large-format “drap de lit” schematic and partner-company collaboration), and the 2021 PCCN transition (keeping the substation in service without a trip, Schneider suite, medium-voltage protection tests and commissioning). The field-inspection role is clarified as including protection checks.

The Fos questionnaire entry is titled 2013–2014 control-command refurbishment but includes flood-restoration context. The original source lists a separate 2014 restoration project at the same plant. Both cards remain in the site pending a later decision about whether to merge them; the answer has been applied to the named 2013–2014 entry without deleting the original 2014 source item.

## 3. Images and documents

The source contained 19 unique media files. The local migration archive keeps the original media files and a JSON media index; eleven selected, compressed WebP copies are used by the new site. The retained originals are:

- Technical and career photos: `p1000664-048f29.jpg`, `dsc-0044-6788f4.jpg`, `dsc-0063-a52c49.jpg`, `img-20211221-234027-6967cb.jpg`, `mms-20141010-163815-d0597c.jpg`, `1000026565-efbce2.jpg`, `20200916132402-ba34ee02-me-baec26.jpg`, and `mms-20141010-163808-d0597c.jpg`.
- Personal-interest photos: `boxe-e32d33.jpg`, `voyages-c54ab8.jpg`, and `rando-f2c311.jpg`.
- Other page graphics: `20230118103108-1c0aa56b-la-a9b3a8.jpg`, `logo-inge-21976b.png`, and the recurring `chatgpt-image-26-nov-2025-23-46-58-ab9957.png`.
- CV-related items: `cven-2025-ea75b4.png`, `cv-fr-2025-ea75b4.png`, `cv-en-type-1-cf1306.png`, `cv-en-type-2-a3243d.png` and `qrcode-5-93e293.jpg`.

The four CV previews are raster images, not downloadable CV documents. OCR confirmed that some previews contain an email address and phone number. They are kept in the private archive and excluded from the new public site and repository. The QR image’s destination could not be verified, so it is also excluded from publication. The portfolio still needs a reviewed CV PDF and, if desired, a verified public professional-profile link. The new administration leaves both destinations empty until the owner configures them; visible header buttons display a localized availability message in the meantime.

## 4. Links recovered

- Internal paths: `/bienvenue`, `/parcours-pro`, `/mes-realisations`, `/mes-objectifs`, `/engagements`.
- A video link appears in the introduction as `https://vimeo.com/manage/videos/1144318152`. It is a management URL, not a verified public viewing link, so the new site uses a clear placeholder instead.
- The Ingé+ section ends with “More about the ingé+ program:” but has no URL after the label.
- The QR code is preserved in the private archive; its destination was not decoded or reused.
- No email address or public contact URL was present in the page text.

External Portfoliobox, CloudFront and site-template resource URLs are retained only in the private snapshot/index where useful for provenance. The new public site does not load code, stylesheets, scripts, fonts or images from Portfoliobox.

## 5. Gaps and source issues

- The original Portfoliobox source did not list qualifications before ENSEEIHT; the user has now supplied a Bac STI, BTS and authorisation codes. The Bac year and validity dates for the authorisations remain unspecified.
- Project detail is now available for the screen modernization, the Fos refurbishment and the 2021 PCCN transition. Constraints, tools/solutions and lessons remain incomplete for the separate 2014 flood-restoration, field-inspection and training projects.
- No verified email, public LinkedIn URL, public video URL, CV PDF, or detail for the civic-engagement menu item.
- Some source statements may be dated: the UK mobility discussion and the objectives are presented in a portfolio created in 2025. They have not been relabelled as current facts.
- Source wording contains typos and inconsistent date descriptions; source facts and outcomes are retained, with editorial spelling corrected in the redesigned site.
- The source page has empty/absent image alternative text for its galleries and no useful SEO descriptions in the exposed page data.
- The current audit captures page data and media, not a full visual or assistive-technology audit of the rendered Portfoliobox interface.

## 6. New architecture and design decisions

The redesigned portfolio is a static bilingual site. French is the default page at `/`; English is at `/en/`. Both pages use the same section IDs and shared CSS/JavaScript, so the FR | EN selector keeps the current section when changing languages. The one-page-per-language structure keeps the site easy to edit while preserving the project details in context.

Project cards separate context, problem/objective, role/approach and reported result. The user’s filled questionnaire has been incorporated into education and three project entries. Remaining project gaps are marked `[CONTENT TO COMPLETE]`; the contact address, CV file, current mobility information and civic-engagement text are also left incomplete rather than guessed.

The visual system uses original HTML and CSS, local compressed images, a custom wave-inspired favicon, semantic sections, visible keyboard focus, a skip link, a mobile navigation button, reduced-motion support and no JavaScript framework. CV previews and the unverified QR are not published. The site uses no Portfoliobox theme code or remote asset dependencies. Language-specific titles, descriptions, Open Graph metadata, canonical URLs, `lang` attributes and `hreflang` alternates are included.

## 7. Checks still required before public release

- Confirm dates and reported impact figures for the historical projects before treating them as current, independently verified metrics.
- Review whether objectives and mobility information remain current.
- Configure GitHub Pages on `main` from the repository root, then verify the public URL, images, anchor navigation and responsive rendering.

## 8. Bilingual edition and publication target

French is the default at `/`; English is available at `/en/`. Section IDs match across locales and the language selector preserves the active section. The English version uses English technical terminology, while official French institutions and programme names remain unchanged where appropriate.

The confirmed repository is `https://github.com/keltonreq2/pm-systems-engineering.github.io`. Since it is a project repository under account `keltonreq2`, the expected Pages URL is `https://keltonreq2.github.io/pm-systems-engineering.github.io/`; verify it in the repository's Pages settings after deployment. The chosen publication target is branch `main`, directory `/`. No custom domain or CNAME is configured.

## 9. Informations absentes masquées du site

La refonte éditoriale a retiré tous les champs à compléter des pages publiques. Les éléments ci-dessous ne sont pas publiés tant que Patrice n’a pas fourni ou validé leur contenu :

1. URL LinkedIn exacte.
2. PDF de CV relu et explicitement destiné à la publication.
3. Niveaux actuels en langues et détails d’un projet de mobilité internationale à rendre public.
4. Adresse de contact professionnelle, si sa publication est souhaitée.
5. Vidéo publique, si une URL de visionnage est fournie.
6. Texte d’engagement citoyen, si cette rubrique doit être conservée.
7. Détails supplémentaires sur l’inspection, le dépannage et certaines actions de formation.

Les aperçus de CV contenant des coordonnées privées et le QR code non vérifié restent exclus du dépôt et du site. Les chiffres de +30 % de fiabilité et de 100 % de remise en état ne sont pas repris, faute de validation indépendante. L’information sur l’absence de déclenchement pendant la transition PCCN et le retour en service de Fos provient des réponses de Patrice.

## 10. Refonte éditoriale et graphique

La seconde version conserve deux pages bilingues à identifiants de section partagés et remplace la navigation par cinq accès : profil, expertise, projets, parcours et international. Elle retire les rubriques mentors, CV, engagement citoyen et contact tant qu’un contenu ou un moyen de contact publiable n’est pas disponible.

Les pages racontent le parcours à la première personne. Trois réalisations sont mises en avant : le dégrilleur de Palaminy, la remise en service de Fos après la crue et la transition numérique du poste de Palaminy. Les travaux d’inspection et la formation sont regroupés en réalisations complémentaires. L’entrée distincte de restauration de Fos de 2014 est fusionnée avec la fiche Fos 2013–2014, car les deux fiches portent sur la même centrale, la même crue et le même retour en service.

Le thème commun s’appuie sur un bleu marine, un fond clair, un accent cyan discret, une typographie système et des images locales. La mise en page réduit les petites cartes, donne davantage d’espace aux projets et garde les mêmes repères visuels dans les deux langues.

Pendant la phase de préparation, les pages demandent aux robots de ne pas indexer ni suivre leurs liens. `robots.txt` permet toutefois leur lecture, afin que les moteurs puissent détecter la consigne noindex. La ligne de sitemap est désactivée jusqu’au lancement officiel. README.md décrit la procédure de réactivation.

## 11. État de publication et vérifications

Le site est prévu pour la branche `main`, depuis la racine du dépôt GitHub Pages. Cette copie de travail contient les changements locaux ; ils doivent être transférés au dépôt avant que la version publique soit mise à jour.

Les contrôles statiques ont été réalisés : aucun langage de migration ni champ à compléter dans les deux HTML, aucun lien local cassé, aucune image sans texte alternatif, balises noindex présentes, et identifiants de section identiques en français et en anglais. Le JavaScript passe `node --check`, le CSS a des accolades équilibrées et définit les adaptations responsive, le focus clavier et `prefers-reduced-motion`.

Le test de rendu Playwright aux largeurs 375, 768, 1024 et 1440 px n’a pas pu s’exécuter : le paquet Playwright est présent, mais aucun navigateur Chromium n’est installé dans cet environnement. Le rendu visuel final doit donc encore être vérifié dans un navigateur local avant le lancement officiel.
