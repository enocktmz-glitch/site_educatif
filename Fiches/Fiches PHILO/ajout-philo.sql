-- =====================================================================
--  Ajout : document « Les citations de philosophie » (Philosophie)
--  À coller dans Supabase > SQL Editor > New query > Run
--  Prérequis : migration-fiches.sql déjà exécutée. Relançable sans danger.
-- =====================================================================
insert into public.fiches (matiere_id, numero, titre, description, fichier_path, ordre, publie)
select m.id, v.numero, v.titre, v.description, v.fichier_path, v.ordre, true
from (values
  ('philo', 'L1', 'La dissertation philosophique', 'Méthode · Structure · Argumentation', 'philo/l1-la-dissertation-philosophique.pdf', 1),
  ('philo', 'L2', 'Le commentaire de texte philosophique', 'Analyse · Explication · Problématisation', 'philo/l2-le-commentaire-de-texte-philosophique.pdf', 2),
  ('philo', 'L3', 'La connaissance de l''homme', NULL, 'philo/l3-la-connaissance-de-l-homme.pdf', 3),
  ('philo', 'L4', 'La vie en société', 'Contrat social · Liberté · Justice · État', 'philo/l4-la-vie-en-societe.pdf', 4),
  ('philo', 'L5', 'Dieu et la religion', NULL, 'philo/l5-dieu-et-la-religion.pdf', 5),
  ('philo', 'L6', 'L''histoire et l''humanité', NULL, 'philo/l6-l-histoire-et-l-humanite.pdf', 6),
  ('philo', 'L7', 'La valeur de la philosophie', NULL, 'philo/l7-la-valeur-de-la-philosophie.pdf', 7),
  ('philo', 'L8', 'Progrès et Bonheur', NULL, 'philo/l8-progres-et-bonheur.pdf', 8),
  ('philo', 'L9', 'Langage et Vérité', NULL, 'philo/l9-langage-et-verite.pdf', 9),
  ('philo', 'L10', 'La Connaissance scientifique', NULL, 'philo/l10-la-connaissance-scientifique.pdf', 10),
  ('philo', 'Cit.', 'Les citations de philosophie', 'Citations commentées, classées par leçon', 'philo/les-citations-de-philosophie.pdf', 11)
) as v(slug, numero, titre, description, fichier_path, ordre)
join public.matieres m on m.slug = v.slug
on conflict (fichier_path) do update
  set matiere_id  = excluded.matiere_id,
      numero      = excluded.numero,
      titre       = excluded.titre,
      description = excluded.description,
      ordre       = excluded.ordre;
