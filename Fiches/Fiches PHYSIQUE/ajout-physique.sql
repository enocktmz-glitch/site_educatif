-- =====================================================================
--  Ajout : 1 nouvelle fiche de Physique (L15) + remise en ordre des fiches
--  À coller dans Supabase > SQL Editor > New query > Run
--  Prérequis : migration-fiches.sql déjà exécutée. Relançable sans danger.
-- =====================================================================
insert into public.fiches (matiere_id, numero, titre, description, fichier_path, ordre, publie)
select m.id, v.numero, v.titre, v.description, v.fichier_path, v.ordre, true
from (values
  ('physique', 'L1', 'Cinématique du point', NULL, 'physique/l1-cinematique-du-point.pdf', 1),
  ('physique', 'L2', 'Mouvement du centre d''inertie d''un solide', NULL, 'physique/l2-mouvement-du-centre-d-inertie-d-un-solide.pdf', 2),
  ('physique', 'L3', 'Interaction gravitationnelle', NULL, 'physique/l3-interaction-gravitationnelle.pdf', 3),
  ('physique', 'L4', 'Mouvement dans les champs G et E uniformes', NULL, 'physique/l4-mouvement-dans-les-champs-g-et-e-uniformes.pdf', 4),
  ('physique', 'L5', 'Oscillations mécaniques libres', NULL, 'physique/l5-oscillations-mecaniques-libres.pdf', 5),
  ('physique', 'L6', 'Champ magnétique', NULL, 'physique/l6-champ-magnetique.pdf', 6),
  ('physique', 'L8', 'Loi de Laplace', NULL, 'physique/l8-loi-de-laplace.pdf', 7),
  ('physique', 'L9', 'Induction électromagnétique', NULL, 'physique/l9-induction-electromagnetique.pdf', 8),
  ('physique', 'L11', 'Montages dérivateur et intégrateur', NULL, 'physique/l11-montages-derivateur-et-integrateur.pdf', 9),
  ('physique', 'L13', 'Circuit RLC en régime sinusoïdal forcé', NULL, 'physique/l13-circuit-rlc-en-regime-sinusoidal-force.pdf', 10),
  ('physique', 'L14', 'Résonance d''intensité', NULL, 'physique/l14-resonance-d-intensite.pdf', 11),
  ('physique', 'L15', 'Puissance en régime sinusoïdal', NULL, 'physique/l15-puissance-en-regime-sinusoidal.pdf', 12),
  ('physique', 'L16', 'Modèle ondulatoire de la lumière', NULL, 'physique/l16-modele-ondulatoire-de-la-lumiere.pdf', 13),
  ('physique', 'L18', 'Réactions nucléaires spontanées', NULL, 'physique/l18-reactions-nucleaires-spontanees.pdf', 14),
  ('physique', 'L19', 'Réactions nucléaires provoquées', NULL, 'physique/l19-reactions-nucleaires-provoquees.pdf', 15)
) as v(slug, numero, titre, description, fichier_path, ordre)
join public.matieres m on m.slug = v.slug
on conflict (fichier_path) do update
  set matiere_id  = excluded.matiere_id,
      numero      = excluded.numero,
      titre       = excluded.titre,
      description = excluded.description,
      ordre       = excluded.ordre;
