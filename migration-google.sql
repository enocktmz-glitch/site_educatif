-- =====================================================================
--  Connexion Google : le profil récupère le nom de l'élève
--  À coller dans Supabase > SQL Editor > New query > Run
--  Relançable sans danger. Ne modifie aucun compte existant.
--
--  Avec un formulaire, le nom arrive dans « nom_complet » ; avec Google,
--  il arrive dans « full_name » (ou « name »). On prend le premier qui existe.
--  Le rôle reste TOUJOURS « eleve » : rien de ce que l'utilisateur ou
--  Google envoie ne peut le changer.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nom_complet, role)
  values (
    new.id,
    left(
      btrim(coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'nom_complet'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        ''
      )),
      100
    ),
    'eleve'
  );
  return new;
end;
$$;

-- Cette fonction ne doit pas être appelable depuis le site
revoke execute on function public.handle_new_user() from public, anon, authenticated;
