-- =====================================================================
--  Migration : adapter la table "matieres" à la page Matières du site
--  À coller dans Supabase > SQL Editor > New query > Run  (UNE seule fois)
-- =====================================================================

-- 1. Nouvelles colonnes (texte affiché sur la page)
alter table public.matieres
  add column if not exists slug        text,
  add column if not exists description text,
  add column if not exists categorie   text,
  add column if not exists couleur     text;

-- 2. On renomme deux anciennes matières de départ pour coller au site
update public.matieres set nom = 'Maths'    where nom = 'Mathématiques';
update public.matieres set nom = 'Physique' where nom = 'Physique-Chimie';

-- 3. Les 9 matières de la page (ajoute ou met à jour, sans rien supprimer)
--    "slug" = nom du fichier de la page de fiches (Fiches/<slug>.html)
insert into public.matieres (nom, slug, emoji, description, categorie, couleur, ordre) values
  ('SVT',                 'svt',            '🌿', 'Biologie · Génétique · Évolution',                    'Sciences',          '#52b788', 1),
  ('Maths',               'maths',          '📐', 'Analyse · Algèbre · Géométrie',                       'Fondamental',       '#2d9cdb', 2),
  ('Physique',            'physique',       '⚡', 'Mécanique · Électricité · Ondes',                     'Sciences',          '#f2994a', 3),
  ('Chimie',              'chimie',         '🧪', 'Réactions chimiques · Solutions · Acides/Bases',      'Sciences',          '#eb5757', 4),
  ('Français',            'francais',       '📝', 'Grammaire · Dissertation · Littérature',              'Lettres',           '#9b51e0', 5),
  ('Philosophie',         'philo',          '🏛️', 'Notions · Argumentation · Dissertation',              'Lettres',           '#1a3d2b', 6),
  ('Anglais',             'anglais',        '🇬🇧', 'Grammar · Vocabulary · Reading comprehension',       'Langues',           '#2d9cdb', 7),
  ('Histoire-Géographie', 'histoire-geo',   '🌍', 'Histoire mondiale · Géopolitique · Cartographie',     'Sciences Humaines', '#f2994a', 8),
  ('Arts Plastiques',     'arts-plastique', '🎨', 'Dessin · Création · Analyse artistique',              'Arts',              '#eb5757', 9)
on conflict (nom) do update set
  slug        = excluded.slug,
  emoji       = excluded.emoji,
  description = excluded.description,
  categorie   = excluded.categorie,
  couleur     = excluded.couleur,
  ordre       = excluded.ordre;

-- 4. Garde-fous : le slug sert à fabriquer un lien et la couleur est
--    utilisée dans le CSS, donc on n'accepte que des formats stricts.
alter table public.matieres alter column slug set not null;

create unique index if not exists matieres_slug_key on public.matieres (slug);

alter table public.matieres drop constraint if exists matieres_slug_format;
alter table public.matieres add  constraint matieres_slug_format
  check (slug ~ '^[a-z0-9-]+$');

alter table public.matieres drop constraint if exists matieres_couleur_format;
alter table public.matieres add  constraint matieres_couleur_format
  check (couleur is null or couleur ~ '^#[0-9a-fA-F]{6}$');
