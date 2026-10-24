-- =====================================================================
--  Migration : cours vidéo (page « Cours Tle D »)
--  À coller dans Supabase > SQL Editor > New query > Run  (UNE seule fois)
--  Prérequis : schema-supabase.sql et migration-matieres.sql déjà exécutés.
--
--  Les vidéos restent sur YouTube : la base ne garde que l'identifiant
--  de chaque vidéo, son titre, sa chaîne et sa durée.
-- =====================================================================

-- 1. Table des vidéos
create table public.cours_videos (
  id          bigint generated always as identity primary key,
  matiere_id  bigint not null references public.matieres (id) on delete cascade,
  titre       text   not null check (char_length(titre) between 1 and 200),
  chaine      text   check (chaine is null or char_length(chaine) <= 100),
  duree       text   check (duree is null or duree ~ '^[0-9]{1,2}(:[0-9]{2}){1,2}$'),   -- ex : 18:32
  youtube_id  text   not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  ordre       int    not null default 0,
  publie      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (matiere_id, youtube_id)
);

create index cours_videos_matiere_ordre_idx on public.cours_videos (matiere_id, ordre, id);


-- 2. Confort : on peut coller le lien YouTube complet dans « youtube_id »,
--    la base en extrait toute seule les 11 caractères de l'identifiant.
create function public.normalize_youtube_id()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  trouve text[];
begin
  new.youtube_id := btrim(new.youtube_id);
  trouve := regexp_match(new.youtube_id, '(?:v=|youtu\.be/|/embed/|/shorts/|/live/)([A-Za-z0-9_-]{11})');
  if trouve is not null then
    new.youtube_id := trouve[1];
  end if;
  return new;
end;
$$;

create trigger cours_videos_normalize
  before insert or update of youtube_id on public.cours_videos
  for each row execute function public.normalize_youtube_id();

revoke execute on function public.normalize_youtube_id() from public, anon, authenticated;


-- 3. Droits et sécurité (même logique que les fiches)
revoke all on public.cours_videos from anon, authenticated;
grant select, insert, update, delete on public.cours_videos to authenticated;

alter table public.cours_videos enable row level security;

create policy "cours : lecture des vidéos publiées"
  on public.cours_videos for select to authenticated
  using (publie or (select public.is_staff()));

create policy "cours : ajout staff"
  on public.cours_videos for insert to authenticated
  with check ((select public.is_staff()));

create policy "cours : modification staff"
  on public.cours_videos for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "cours : suppression admin"
  on public.cours_videos for delete to authenticated
  using ((select public.is_admin()));


-- 4. EXEMPLE pour ajouter une vidéo (retire les deux tirets de début pour l'utiliser).
--    Tu peux aussi le faire à la main dans Table Editor > cours_videos.
-- insert into public.cours_videos (matiere_id, titre, chaine, duree, youtube_id, ordre)
-- select id, 'Titre de la vidéo', 'Nom de la chaîne', '18:32',
--        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1
--   from public.matieres where slug = 'maths';
