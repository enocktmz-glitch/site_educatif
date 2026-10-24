-- =====================================================================
--  Révision Tle D : schéma de base de données Supabase (version 1)
--  À coller dans : Supabase > SQL Editor > New query > Run
--  Public visé pour l'instant : les élèves. Les rôles enseignant/admin
--  sont déjà prévus pour la future version.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TYPES
-- ---------------------------------------------------------------------
create type public.user_role as enum ('eleve', 'enseignant', 'admin');


-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- Un profil par utilisateur (lié à Supabase Auth)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nom_complet text check (char_length(nom_complet) <= 100),
  role        public.user_role not null default 'eleve',
  created_at  timestamptz not null default now()
);

-- Matières
create table public.matieres (
  id     bigint generated always as identity primary key,
  nom    text not null unique check (char_length(nom) <= 80),
  emoji  text,
  ordre  int  not null default 0
);

-- Fiches de révision
create table public.fiches (
  id            bigint generated always as identity primary key,
  matiere_id    bigint not null references public.matieres (id) on delete cascade,
  titre         text   not null check (char_length(titre) <= 200),
  contenu       text,
  fichier_path  text,                       -- chemin d'un PDF dans Supabase Storage (plus tard)
  publie        boolean not null default false,
  auteur_id     uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Exercices et corrigés
create table public.exercices (
  id          bigint generated always as identity primary key,
  matiere_id  bigint not null references public.matieres (id) on delete cascade,
  titre       text   not null check (char_length(titre) <= 200),
  enonce      text   not null,
  corrige     text,
  difficulte  smallint not null default 1 check (difficulte between 1 and 3),
  publie      boolean  not null default false,
  auteur_id   uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Planning de révision (privé à chaque élève)
create table public.planning (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  matiere_id   bigint references public.matieres (id) on delete set null,
  titre        text not null check (char_length(titre) <= 200),
  date_prevue  date not null,
  termine      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Progression (privée à chaque élève) : une ligne par fiche OU par exercice
create table public.progression (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  fiche_id     bigint references public.fiches (id) on delete cascade,
  exercice_id  bigint references public.exercices (id) on delete cascade,
  termine      boolean not null default true,
  score        smallint check (score between 0 and 100),
  updated_at   timestamptz not null default now(),
  -- exactement un des deux doit être renseigné
  constraint progression_une_cible check (num_nonnulls(fiche_id, exercice_id) = 1)
);

create unique index progression_unique_fiche
  on public.progression (user_id, fiche_id) where fiche_id is not null;
create unique index progression_unique_exercice
  on public.progression (user_id, exercice_id) where exercice_id is not null;

-- Index sur les clés étrangères
create index on public.fiches      (matiere_id);
create index on public.exercices   (matiere_id);
create index on public.planning    (user_id, date_prevue);
create index on public.progression (user_id);


-- ---------------------------------------------------------------------
-- 3. FONCTIONS ET TRIGGERS
-- ---------------------------------------------------------------------

-- Crée automatiquement le profil à l'inscription.
-- Le rôle est TOUJOURS 'eleve' : on ignore volontairement toute valeur
-- envoyée par le client (sinon n'importe qui pourrait se déclarer admin).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nom_complet, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'nom_complet', ''), 100),
    'eleve'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vrai si l'utilisateur connecté est enseignant ou admin (pour la v2)
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('enseignant', 'admin')
  );
$$;

-- Vrai si l'utilisateur connecté est admin
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Met à jour updated_at automatiquement
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger progression_updated_at
  before update on public.progression
  for each row execute function public.set_updated_at();

-- Ces fonctions ne doivent pas être appelables par n'importe qui via l'API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_staff()        from public, anon;
revoke execute on function public.is_admin()        from public, anon;
grant  execute on function public.is_staff()        to authenticated;
grant  execute on function public.is_admin()        to authenticated;


-- ---------------------------------------------------------------------
-- 4. DROITS (GRANT) : on part de zéro, on n'ouvre que le nécessaire
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.matieres, public.fiches,
              public.exercices, public.planning, public.progression
  from anon, authenticated;

-- Profils : lecture de son propre profil, modification du nom uniquement
-- (la colonne "role" n'est PAS modifiable par l'utilisateur)
grant select on public.profiles to authenticated;
grant update (nom_complet) on public.profiles to authenticated;

-- Contenu pédagogique : lecture pour les connectés,
-- écriture limitée aux enseignants/admins par les politiques RLS
grant select                         on public.matieres, public.fiches, public.exercices to authenticated;
grant insert, update, delete         on public.matieres, public.fiches, public.exercices to authenticated;

-- Données personnelles de l'élève
grant select, insert, update, delete on public.planning, public.progression to authenticated;


-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.matieres    enable row level security;
alter table public.fiches      enable row level security;
alter table public.exercices   enable row level security;
alter table public.planning    enable row level security;
alter table public.progression enable row level security;

-- PROFILES : chacun voit et modifie (nom seulement) son propre profil
create policy "profil : lecture du sien"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profil : modification du sien"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- MATIERES
create policy "matieres : lecture connectés"
  on public.matieres for select to authenticated
  using (true);

create policy "matieres : écriture staff"
  on public.matieres for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- FICHES : les élèves ne voient que les fiches publiées
create policy "fiches : lecture publiées"
  on public.fiches for select to authenticated
  using (publie or (select public.is_staff()));

create policy "fiches : écriture staff"
  on public.fiches for insert to authenticated
  with check ((select public.is_staff()));

create policy "fiches : modification staff"
  on public.fiches for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "fiches : suppression admin"
  on public.fiches for delete to authenticated
  using ((select public.is_admin()));

-- EXERCICES : même logique que les fiches
create policy "exercices : lecture publiés"
  on public.exercices for select to authenticated
  using (publie or (select public.is_staff()));

create policy "exercices : écriture staff"
  on public.exercices for insert to authenticated
  with check ((select public.is_staff()));

create policy "exercices : modification staff"
  on public.exercices for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "exercices : suppression admin"
  on public.exercices for delete to authenticated
  using ((select public.is_admin()));

-- PLANNING et PROGRESSION : strictement privés
create policy "planning : accès au sien"
  on public.planning for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "progression : accès à la sienne"
  on public.progression for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 6. DONNÉES DE DÉPART
-- ---------------------------------------------------------------------
insert into public.matieres (nom, emoji, ordre) values
  ('Mathématiques',     '📐', 1),
  ('Physique-Chimie',   '🧪', 2),
  ('SVT',               '🌱', 3),
  ('Français',          '📖', 4),
  ('Philosophie',       '💭', 5),
  ('Histoire-Géographie','🌍', 6),
  ('Anglais',           '🗣️', 7);


-- ---------------------------------------------------------------------
-- 7. TON COMPTE ADMIN (à exécuter APRÈS t'être inscrit sur le site)
--    Remplace l'adresse e-mail puis retire les deux tirets de début.
-- ---------------------------------------------------------------------
-- update public.profiles
--    set role = 'admin'
--  where id = (select id from auth.users where email = 'ton-email@exemple.com');
