-- CAM preparation. Apply once with the existing D1 migration workflow after review.
-- Only the specified career/mobility text fields and mandatory CEP protection change.
INSERT INTO settings(key,value,updated_at) VALUES('cep_protected','true',unixepoch())
ON CONFLICT(key) DO UPDATE SET value='true',updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.chapter_1.text','En 2026, je suis formateur à EDF UFPI Toulouse, spécialisé dans les protections électriques et le contrôle-commande hydroélectrique. Je poursuis en parallèle ma formation d’ingénieur 3EA à l’ENSEEIHT.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.chapter_2.period','2028 · diplôme visé',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.chapter_2.text','Je prépare le diplôme d’ingénieur 3EA de l’ENSEEIHT, visé en 2028. Cette formation approfondit mes compétences en génie électrique, en protections et en contrôle-commande.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.chapter_3.period','Horizon 2029–2031',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.chapter_3.text','J’envisage une progression vers davantage de responsabilités en ingénierie, en expertise des protections et en conduite de projets. Ce projet se construira selon les compétences acquises et les possibilités professionnelles.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_1.title','Formateur et élève ingénieur',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_1.text','EDF UFPI Toulouse : protections électriques et contrôle-commande hydroélectrique ; formation d’ingénieur 3EA à l’ENSEEIHT en cours.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_2.date','Août 2027',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_2.title','Mobilité de quatre semaines visée',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_2.text','Irlande, Norvège et Islande étudiées. Départ sous réserve d’un accueil et des validations nécessaires.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_3.title','Diplôme d’ingénieur visé',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_3.text','Diplôme 3EA de l’ENSEEIHT visé en 2028, en cours de préparation.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_4.date','2029–2031',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_4.title','Progression envisagée',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.timeline.step_4.text','Projet d’évolution vers davantage de responsabilités en ingénierie, expertise des protections et conduite de projets.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international.narrative','Cette mobilité doit m’aider à passer de l’expérience de terrain et de la formation technique à une approche plus large du métier d’ingénieur. Pendant quatre semaines visées en août 2027, je souhaite découvrir d’autres pratiques en génie électrique, en hydroélectricité ou dans les systèmes énergétiques, comparer les méthodes de travail et développer mon anglais professionnel. Travailler avec une équipe d’un autre pays renforcerait ma collaboration interculturelle et ma communication technique. Je pourrais ensuite mobiliser ces apprentissages dans mes formations et dans de futurs projets d’ingénierie et de protections. L’accueil et les modalités restent à confirmer.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.mobility_focus.fact_1','Irlande, Norvège et Islande. Candidatures effectuées en Irlande ; pistes norvégiennes et islandaises à explorer.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.mobility_focus.fact_2','Quatre semaines en août 2027, sous réserve d’un accueil et des validations nécessaires.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.mobility_focus.fact_3','Découvrir d’autres pratiques en génie électrique, hydroélectricité ou systèmes énergétiques ; comparer les méthodes de travail et développer mon anglais professionnel.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.mobility_focus.fact_4','Développer mon anglais professionnel et ma communication technique.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.mobility_focus.fact_5','Protections et systèmes électriques · approche d’ingénierie · collaboration interculturelle · communication technique en anglais.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.mobility_focus.fact_6','Candidatures engagées en Irlande ; autres pistes à l’étude. Accueil et modalités à confirmer.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.heading','Mobilité internationale : pistes à l’étude',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.country','Irlande, Norvège et Islande ; aucun pays d’accueil confirmé.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.organisation','Structure d’accueil à confirmer. Candidatures engagées en Irlande ; autres pistes à explorer.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.location','Lieu d’accueil à confirmer.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.period','Quatre semaines en août 2027, sous réserve d’un accueil et des validations nécessaires.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.status','Candidatures engagées en Irlande ; autres pistes à l’étude. Accueil et modalités à confirmer.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.objective','Découvrir d’autres pratiques en génie électrique, hydroélectricité ou systèmes énergétiques, comparer les méthodes de travail et développer mon anglais professionnel.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.skills','Protections et systèmes électriques, approche d’ingénierie, collaboration interculturelle et communication technique en anglais.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.languages','Anglais professionnel : progression recherchée pendant la mobilité.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.motivation','Élargir mon expérience de terrain et de formateur en confrontant mes pratiques à celles d’une équipe internationale.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.technical_goals','Observer les pratiques en systèmes électriques, hydroélectricité ou énergie et comparer les méthodes d’analyse et de travail.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.competencies','Renforcer ma démarche d’ingénierie, ma collaboration interculturelle et ma communication technique en anglais.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.benefits','Réinvestir ces apprentissages dans mes formations et mes futurs projets en ingénierie et en protections.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.language_plan','Développer les échanges professionnels et le vocabulaire technique en anglais au contact d’une équipe d’accueil.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.international_detail.five_year_link','Une étape d’apprentissage en août 2027 avant le diplôme visé en 2028, au service d’une progression envisagée à l’horizon 2029–2031.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('fr','project.cep.intro','Retrouvez dans l’espace CEP mes CV français et anglais, mon profil LinkedIn et ma présentation CAM de cinq diapositives maximum.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.chapter_1.text','In 2026, I am a technical trainer at EDF UFPI Toulouse, specialising in electrical protection and hydropower control and automation. I am also studying for the 3EA engineering degree at ENSEEIHT.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.chapter_2.period','2028 · target graduation',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.chapter_2.text','I am preparing the 3EA engineering degree at ENSEEIHT, with graduation targeted for 2028. The programme develops my skills in electrical engineering, protection, control and automation.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.chapter_3.period','2029–2031 horizon',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.chapter_3.text','I aim to progress towards greater responsibility in engineering, protection expertise and project delivery. This career plan will develop with the skills I acquire and the professional opportunities available.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_1.title','Trainer and engineering student',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_1.text','EDF UFPI Toulouse: electrical protection and hydropower control and automation; 3EA engineering studies at ENSEEIHT in progress.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_2.date','August 2027',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_2.title','Target: four weeks abroad',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_2.text','Ireland, Norway and Iceland under consideration. Subject to a host placement and the necessary approvals.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_3.title','Target engineering degree',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_3.text','3EA engineering degree at ENSEEIHT targeted for 2028; studies in progress.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_4.date','2029–2031',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_4.title','Planned career progression',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.timeline.step_4.text','Aiming for greater responsibility in engineering, protection expertise and project delivery.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international.narrative','This experience would help me build on my field and technical training background and develop a broader engineering perspective. During four weeks targeted for August 2027, I would like to discover other practices in electrical engineering, hydropower or energy systems, compare working methods and develop my professional English. Working with a team in another country would strengthen my intercultural collaboration and technical communication. I could then apply what I learn to my training work and future engineering and protection projects. The host placement and arrangements remain to be confirmed.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.mobility_focus.fact_1','Ireland, Norway and Iceland. Applications submitted in Ireland; Norwegian and Icelandic opportunities still to be explored.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.mobility_focus.fact_2','Four weeks in August 2027, subject to a host placement and the necessary approvals.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.mobility_focus.fact_3','Discover other practices in electrical engineering, hydropower or energy systems; compare working methods and develop my professional English.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.mobility_focus.fact_4','Develop my professional English and technical communication.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.mobility_focus.fact_5','Electrical protection and power systems · engineering approach · intercultural collaboration · technical communication in English.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.mobility_focus.fact_6','Applications submitted in Ireland; other opportunities under consideration. Host placement and arrangements to be confirmed.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.heading','International mobility: opportunities under consideration',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.country','Ireland, Norway and Iceland; no host country confirmed.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.organisation','Host organisation to be confirmed. Applications submitted in Ireland; other opportunities still to be explored.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.location','Host location to be confirmed.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.period','Four weeks in August 2027, subject to a host placement and the necessary approvals.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.status','Applications submitted in Ireland; other opportunities under consideration. Host placement and arrangements to be confirmed.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.objective','Discover other practices in electrical engineering, hydropower or energy systems, compare working methods and develop my professional English.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.skills','Electrical protection and power systems, engineering approach, intercultural collaboration and technical communication in English.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.languages','Professional English: further development during the placement.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.motivation','Broaden my experience as a field professional and trainer by comparing practices with an international team.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.technical_goals','Observe practices in electrical systems, hydropower or energy and compare engineering and working methods.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.competencies','Strengthen my engineering approach, intercultural collaboration and technical communication in English.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.benefits','Apply these learning outcomes to my training work and future engineering and protection projects.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.language_plan','Develop professional conversations and technical vocabulary in English through work with a host team.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.international_detail.five_year_link','A learning step in August 2027 before target graduation in 2028, supporting planned career progression in 2029–2031.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO content_overrides(language,content_key,value,updated_at) VALUES('en','project.cep.intro','The CEP area brings together my French and English CVs, my LinkedIn profile and my CAM presentation of five slides maximum.',unixepoch())
ON CONFLICT(language,content_key) DO UPDATE SET value=excluded.value,updated_at=unixepoch();
INSERT INTO settings(key,value,updated_at) VALUES('cam_2026_cep_applied','true',unixepoch()) ON CONFLICT(key) DO NOTHING;
