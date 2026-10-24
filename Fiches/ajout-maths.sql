-- =====================================================================
--  Ajout : 5 nouvelles fiches de Maths (L06, L07, L09, L10, L12)
--  + remise en ordre des fiches de Maths par numéro de leçon
--  À coller dans Supabase > SQL Editor > New query > Run
--  Prérequis : migration-fiches.sql déjà exécutée. Relançable sans danger.
-- =====================================================================
insert into public.fiches (matiere_id, numero, titre, description, fichier_path, ordre, publie)
select m.id, v.numero, v.titre, v.description, v.fichier_path, v.ordre, true
from (values
  ('maths', 'L01', 'Limites et Continuité', 'Limites de fonctions · Continuité · Théorèmes', 'maths/l01-limites-et-continuite.pdf', 1),
  ('maths', 'L02', 'Probabilité', NULL, 'maths/l02-probabilite.pdf', 2),
  ('maths', 'L03', 'Dérivabilité et étude de fonctions', NULL, 'maths/l03-derivabilite-et-etude-de-fonctions.pdf', 3),
  ('maths', 'L04', 'Primitives', 'Intégration · Techniques de calcul · Applications', 'maths/l04-primitives.pdf', 4),
  ('maths', 'L05', 'Fonctions logarithmes', NULL, 'maths/l05-fonctions-logarithmes.pdf', 5),
  ('maths', 'L06', 'Nombres complexes', NULL, 'maths/l06-nombres-complexes.pdf', 6),
  ('maths', 'L07', 'Fonctions exponentielles et fonctions puissances', NULL, 'maths/l07-fonctions-exponentielles-et-fonctions-puissances.pdf', 7),
  ('maths', 'L08', 'Nombres complexes et géométrie du plan', 'Forme algébrique · Module · Argument · Transformations', 'maths/l08-nombres-complexes-et-geometrie-du-plan.pdf', 8),
  ('maths', 'L09', 'Suites numériques', NULL, 'maths/l09-suites-numeriques.pdf', 9),
  ('maths', 'L10', 'Calcul intégral', NULL, 'maths/l10-calcul-integral.pdf', 10),
  ('maths', 'L12', 'Équations différentielles', NULL, 'maths/l12-equations-differentielles.pdf', 11)
) as v(slug, numero, titre, description, fichier_path, ordre)
join public.matieres m on m.slug = v.slug
on conflict (fichier_path) do update
  set matiere_id  = excluded.matiere_id,
      numero      = excluded.numero,
      titre       = excluded.titre,
      description = excluded.description,
      ordre       = excluded.ordre;
