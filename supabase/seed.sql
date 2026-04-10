-- Local dev master user (requested). Email: admin@designworks.app — Password: 1234
-- Applied after migrations when you run `supabase db reset`.
-- For hosted Supabase, create the same user in Dashboard → Authentication (or use this SQL in SQL editor as a superuser).

create extension if not exists pgcrypto;

do $$
declare
  master_id uuid := 'a1000000-0000-4000-8000-000000000001'::uuid;
  master_email text := 'admin@designworks.app';
  resort_id uuid := 'b2000000-0000-4000-8000-000000000001'::uuid;
  map_id uuid := 'c3000000-0000-4000-8000-000000000001'::uuid;
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    master_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    master_email,
    crypt('1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"onboarding_complete": true}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    master_id,
    master_id,
    jsonb_build_object('sub', master_id::text, 'email', master_email),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.resorts (id, owner_id, name, slug, plan)
  values (resort_id, master_id, 'Design Works Demo', 'designworks-demo', 'pro');

  insert into public.maps (id, resort_id, name, is_published)
  values (map_id, resort_id, 'Demo Map', true);
end $$;
