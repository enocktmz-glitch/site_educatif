-- =====================================================================
--  Migration : fiches de cours + stockage privé des PDF
--  À coller dans Supabase > SQL Editor > New query > Run  (UNE seule fois)
--  Prérequis : schema-supabase.sql et migration-matieres.sql déjà exécutés.
-- =====================================================================

-- 1. Colonnes utilisées par la page des fiches
alter table public.fiches
  add column if not exists numero      text,
  add column if not exists description text,
  add column if not exists ordre       int not null default 0;

-- Le chemin d'un PDF doit avoir la forme  matiere/nom-simple.pdf
alter table public.fiches drop constraint if exists fiches_path_format;
alter table public.fiches add  constraint fiches_path_format
  check (fichier_path is null or fichier_path ~ '^[a-z0-9-]+/[a-z0-9._-]+\.pdf$');

create unique index if not exists fiches_fichier_path_key on public.fiches (fichier_path);
create index if not exists fiches_matiere_ordre_idx on public.fiches (matiere_id, ordre);


-- 2. Espace de stockage PRIVÉ pour les PDF (jamais accessible sans connexion)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fiches', 'fiches', false, 26214400, array['application/pdf'])   -- 25 Mo max, PDF seulement
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400,
      allowed_mime_types = array['application/pdf'];


-- 3. Qui peut lire / écrire les PDF
drop policy if exists "fiches pdf : lecture connectés" on storage.objects;
create policy "fiches pdf : lecture connectés"
  on storage.objects for select to authenticated
  using (bucket_id = 'fiches');

-- (pour la future version : les enseignants/admins pourront envoyer des PDF)
drop policy if exists "fiches pdf : ajout staff" on storage.objects;
create policy "fiches pdf : ajout staff"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fiches' and (select public.is_staff()));

drop policy if exists "fiches pdf : modification staff" on storage.objects;
create policy "fiches pdf : modification staff"
  on storage.objects for update to authenticated
  using (bucket_id = 'fiches' and (select public.is_staff()))
  with check (bucket_id = 'fiches' and (select public.is_staff()));

drop policy if exists "fiches pdf : suppression staff" on storage.objects;
create policy "fiches pdf : suppression staff"
  on storage.objects for delete to authenticated
  using (bucket_id = 'fiches' and (select public.is_staff()));


-- 4. Les 66 fiches déjà présentes sur le site
--    (relançable sans danger : une fiche déjà présente est simplement mise à jour)
insert into public.fiches (matiere_id, numero, titre, description, fichier_path, ordre, publie)
select m.id, v.numero, v.titre, v.description, v.fichier_path, v.ordre, true
from (values
  ('svt', 'L1', 'Le réflexe conditionnel', 'Système nerveux · Arc réflexe · Conditionnement', 'svt/l1-le-reflexe-conditionnel.pdf', 1),
  ('svt', 'L2', 'Le fonctionnement du tissu nerveux', 'Neurones · Influx nerveux · Synapses', 'svt/l2-le-fonctionnement-du-tissu-nerveux.pdf', 2),
  ('svt', 'L4', 'Le fonctionnement du cœur', 'Cycles cardiaques · Révolution cardiaque · Régulation', 'svt/l4-le-fonctionnement-du-coeur.pdf', 3),
  ('svt', 'L5', 'Le maintien de la constance du milieu intérieur', NULL, 'svt/l5-le-maintien-de-la-constance-du-milieu-interieur.pdf', 4),
  ('svt', 'L6', 'Le système de défense de l''organisme', NULL, 'svt/l6-le-systeme-de-defense-de-l-organisme.pdf', 5),
  ('svt', 'L7', 'L''infection de l''organisme par le VIH', NULL, 'svt/l7-l-infection-de-l-organisme-par-le-vih.pdf', 6),
  ('svt', 'L8', 'Le devenir des cellules sexuelles chez les mammifères', NULL, 'svt/l8-le-devenir-des-cellules-sexuelles-chez-les-mammiferes.pdf', 7),
  ('svt', 'L9', 'Le fonctionnement des organes sexuels chez l''Homme', NULL, 'svt/l9-le-fonctionnement-des-organes-sexuels-chez-l-homme.pdf', 8),
  ('svt', 'L10', 'La reproduction chez les spermaphytes', NULL, 'svt/l10-la-reproduction-chez-les-spermaphytes.pdf', 9),
  ('svt', 'L11', 'La transmission d''un caractère héréditaire chez l''Homme', NULL, 'svt/l11-la-transmission-d-un-caractere-hereditaire-chez-l-homme.pdf', 10),
  ('svt', 'L12', 'La transmission de deux caractères héréditaires chez les êtres vivants', NULL, 'svt/l12-la-transmission-de-deux-caracteres-hereditaires-chez-les.pdf', 11),
  ('svt', 'L14', 'L''exploitation des gisements miniers', NULL, 'svt/l14-l-exploitation-des-gisements-miniers.pdf', 12),
  ('svt', 'L15', 'L''amélioration et la protection des sols', NULL, 'svt/l15-l-amelioration-et-la-protection-des-sols.pdf', 13),
  ('maths', 'L01', 'Limites et Continuité', 'Limites de fonctions · Continuité · Théorèmes', 'maths/l01-limites-et-continuite.pdf', 1),
  ('maths', 'L02', 'Probabilité', NULL, 'maths/l02-probabilite.pdf', 2),
  ('maths', 'L03', 'Dérivabilité et étude de fonctions', NULL, 'maths/l03-derivabilite-et-etude-de-fonctions.pdf', 3),
  ('maths', 'L04', 'Primitives', 'Intégration · Techniques de calcul · Applications', 'maths/l04-primitives.pdf', 4),
  ('maths', 'L05', 'Fonctions logarithmes', NULL, 'maths/l05-fonctions-logarithmes.pdf', 5),
  ('maths', 'L08', 'Nombres complexes et géométrie du plan', 'Forme algébrique · Module · Argument · Transformations', 'maths/l08-nombres-complexes-et-geometrie-du-plan.pdf', 6),
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
  ('physique', 'L16', 'Modèle ondulatoire de la lumière', NULL, 'physique/l16-modele-ondulatoire-de-la-lumiere.pdf', 12),
  ('physique', 'L18', 'Réactions nucléaires spontanées', NULL, 'physique/l18-reactions-nucleaires-spontanees.pdf', 13),
  ('physique', 'L19', 'Réactions nucléaires provoquées', NULL, 'physique/l19-reactions-nucleaires-provoquees.pdf', 14),
  ('chimie', 'L1', 'Les alcools', 'Structure · Propriétés · Réactions', 'chimie/l1-les-alcools.pdf', 1),
  ('chimie', 'L2', 'Composés carbonylés', 'Aldéhydes · Cétones · Réactivité', 'chimie/l2-composes-carbonyles.pdf', 2),
  ('chimie', 'L3', 'Les amines', 'Classification · Nomenclature · Propriétés', 'chimie/l3-les-amines.pdf', 3),
  ('chimie', 'L4', 'Acides carboxyliques et dérivés', 'Esters · Anhydrides · Amides', 'chimie/l4-acides-carboxyliques-et-derives.pdf', 4),
  ('chimie', 'L5', 'Fabrication d''un savon', 'Saponification · Corps gras · Tensioactifs', 'chimie/l5-fabrication-d-un-savon.pdf', 5),
  ('chimie', 'L6', 'Solutions aqueuses — Notion de pH', 'Dissolution · Concentration · pH', 'chimie/l6-solutions-aqueuses-notion-de-ph.pdf', 6),
  ('chimie', 'L7', 'Acide fort — Base forte', 'Ionisation complète · Calcul de pH', 'chimie/l7-acide-fort-base-forte.pdf', 7),
  ('chimie', 'L8', 'Acide faible — Base faible', 'Constante Ka · Taux d''ionisation', 'chimie/l8-acide-faible-base-faible.pdf', 8),
  ('chimie', 'L9', 'Couple acide-base', 'Théorie de Brønsted · Conjugaison', 'chimie/l9-couple-acide-base.pdf', 9),
  ('chimie', 'L10', 'Réactions acidobasiques · Solutions tampons', 'Équilibre · pH tampon · Applications', 'chimie/l10-reactions-acidobasiques-solutions-tampons.pdf', 10),
  ('chimie', 'L11', 'Dosage Acido-Basique', 'Titrage · Point d''équivalence · Indicateurs', 'chimie/l11-dosage-acido-basique.pdf', 11),
  ('chimie', 'L12', 'Acides alpha-aminés', 'Structure · Peptides · Protéines', 'chimie/l12-acides-alpha-amines.pdf', 12),
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
  ('histoire-geo', 'G1', 'Les fondements du développement économique de la Côte d''Ivoire', 'Économie · Ressources · Histoire nationale', 'histoire-geo/g1-les-fondements-du-developpement-economique-de-la-cote-d.pdf', 1),
  ('histoire-geo', 'G2', 'Les secteurs d''activités économiques de la Côte d''Ivoire', NULL, 'histoire-geo/g2-les-secteurs-d-activites-economiques-de-la-cote-d-ivoire.pdf', 2),
  ('histoire-geo', 'G3', 'Les problèmes de développement économique de la Côte d''Ivoire', NULL, 'histoire-geo/g3-les-problemes-de-developpement-economique-de-la-cote-d.pdf', 3),
  ('histoire-geo', 'G4', 'Les fondements du développement économique de la Corée du Sud', NULL, 'histoire-geo/g4-les-fondements-du-developpement-economique-de-la-coree-du.pdf', 4),
  ('histoire-geo', 'G6', 'La CEDEAO, une organisation régionale à caractère économique', NULL, 'histoire-geo/g6-la-cedeao-une-organisation-regionale-a-caractere-economique.pdf', 5),
  ('histoire-geo', 'H1', 'L''Organisation des Nations Unies (ONU)', 'Histoire · Structure · Rôle mondial', 'histoire-geo/h1-l-organisation-des-nations-unies-onu.pdf', 6),
  ('histoire-geo', 'H2', 'L''ère de la bipolarisation de 1947 à 1991', NULL, 'histoire-geo/h2-l-ere-de-la-bipolarisation-de-1947-a-1991.pdf', 7),
  ('histoire-geo', 'H3', 'De la fin de la guerre froide vers un monde multipolaire', NULL, 'histoire-geo/h3-de-la-fin-de-la-guerre-froide-vers-un-monde-multipolaire.pdf', 8),
  ('histoire-geo', 'H4', 'La montée des nationalismes', NULL, 'histoire-geo/h4-la-montee-des-nationalismes.pdf', 9),
  ('histoire-geo', 'H5', 'L''accession de la Côte d''Ivoire à l''indépendance', NULL, 'histoire-geo/h5-l-accession-de-la-cote-d-ivoire-a-l-independance.pdf', 10),
  ('histoire-geo', 'H7', 'L''Union Africaine', 'Fondation · Objectifs · Institutions', 'histoire-geo/h7-l-union-africaine.pdf', 11)
) as v(slug, numero, titre, description, fichier_path, ordre)
join public.matieres m on m.slug = v.slug
on conflict (fichier_path) do update
  set matiere_id  = excluded.matiere_id,
      numero      = excluded.numero,
      titre       = excluded.titre,
      description = excluded.description,
      ordre       = excluded.ordre;
