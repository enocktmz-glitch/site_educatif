-- =====================================================================
--  Ajout : 3 nouvelles fiches d'Histoire-Géographie (G7, H8, H9)
--  + remise en ordre des 14 fiches (géographie d'abord, puis histoire)
--  À coller dans Supabase > SQL Editor > New query > Run
--  Prérequis : migration-fiches.sql déjà exécutée. Relançable sans danger.
-- =====================================================================
insert into public.fiches (matiere_id, numero, titre, description, fichier_path, ordre, publie)
select m.id, v.numero, v.titre, v.description, v.fichier_path, v.ordre, true
from (values
  ('histoire-geo', 'G1', 'Les fondements du développement économique de la Côte d''Ivoire', 'Économie · Ressources · Histoire nationale', 'histoire-geo/g1-les-fondements-du-developpement-economique-de-la-cote-d.pdf', 1),
  ('histoire-geo', 'G2', 'Les secteurs d''activités économiques de la Côte d''Ivoire', NULL, 'histoire-geo/g2-les-secteurs-d-activites-economiques-de-la-cote-d-ivoire.pdf', 2),
  ('histoire-geo', 'G3', 'Les problèmes de développement économique de la Côte d''Ivoire', NULL, 'histoire-geo/g3-les-problemes-de-developpement-economique-de-la-cote-d.pdf', 3),
  ('histoire-geo', 'G4', 'Les fondements du développement économique de la Corée du Sud', NULL, 'histoire-geo/g4-les-fondements-du-developpement-economique-de-la-coree-du.pdf', 4),
  ('histoire-geo', 'G6', 'La CEDEAO, une organisation régionale à caractère économique', NULL, 'histoire-geo/g6-la-cedeao-une-organisation-regionale-a-caractere-economique.pdf', 5),
  ('histoire-geo', 'G7', 'Les relations UE-ACP, un exemple de coopération Nord-Sud', NULL, 'histoire-geo/g7-les-relations-ue-acp-un-exemple-de-cooperation-nord-sud.pdf', 6),
  ('histoire-geo', 'H1', 'L''Organisation des Nations Unies (ONU)', 'Histoire · Structure · Rôle mondial', 'histoire-geo/h1-l-organisation-des-nations-unies-onu.pdf', 7),
  ('histoire-geo', 'H2', 'L''ère de la bipolarisation de 1947 à 1991', NULL, 'histoire-geo/h2-l-ere-de-la-bipolarisation-de-1947-a-1991.pdf', 8),
  ('histoire-geo', 'H3', 'De la fin de la guerre froide vers un monde multipolaire', NULL, 'histoire-geo/h3-de-la-fin-de-la-guerre-froide-vers-un-monde-multipolaire.pdf', 9),
  ('histoire-geo', 'H4', 'La montée des nationalismes', NULL, 'histoire-geo/h4-la-montee-des-nationalismes.pdf', 10),
  ('histoire-geo', 'H5', 'L''accession de la Côte d''Ivoire à l''indépendance', NULL, 'histoire-geo/h5-l-accession-de-la-cote-d-ivoire-a-l-independance.pdf', 11),
  ('histoire-geo', 'H7', 'L''Union Africaine', 'Fondation · Objectifs · Institutions', 'histoire-geo/h7-l-union-africaine.pdf', 12),
  ('histoire-geo', 'H8', 'Croyances et valeurs dominantes dans le monde occidental', NULL, 'histoire-geo/h8-croyances-et-valeurs-dominantes-dans-le-monde-occidental.pdf', 13),
  ('histoire-geo', 'H9', 'Les mutations contemporaines de la civilisation négro-africaine', NULL, 'histoire-geo/h9-les-mutations-contemporaines-de-la-civilisation-negro.pdf', 14)
) as v(slug, numero, titre, description, fichier_path, ordre)
join public.matieres m on m.slug = v.slug
on conflict (fichier_path) do update
  set matiere_id  = excluded.matiere_id,
      numero      = excluded.numero,
      titre       = excluded.titre,
      description = excluded.description,
      ordre       = excluded.ordre;
