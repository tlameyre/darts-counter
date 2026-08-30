-- ============================================================
-- DARTS TRAINER — Supabase schema
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Profiles (1 par utilisateur)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  username    text,
  friend_code text unique,
  settings    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Lecture du propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Insertion du propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Mise à jour du propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Lecture partielle pour la recherche par friend_code (ajout d'amis)
create policy "Lecture publique par friend_code"
  on public.profiles for select
  using (true);

-- Créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_code text;
  code_exists boolean;
begin
  -- Génère un friend_code unique au format DMC-XXXX
  loop
    new_code := 'DMC-' || substring(md5(random()::text) from 1 for 4);
    new_code := upper(new_code);
    select exists(select 1 from public.profiles where friend_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;

  insert into public.profiles (id, username, friend_code)
  values (new.id, new.raw_user_meta_data->>'username', new_code)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Badges utilisateur
create table public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  badge_id    text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Lecture propres badges"
  on public.user_badges for select using (auth.uid() = user_id);

create policy "Insertion propres badges"
  on public.user_badges for insert with check (auth.uid() = user_id);


-- 3. Sessions Score Training
create table public.game_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  correct_count   int not null,
  total_questions int not null,
  best_streak     int default 0,
  settings        jsonb default '{}'::jsonb,
  played_at       timestamptz default now()
);

alter table public.game_sessions enable row level security;

create policy "Lecture propres sessions game"
  on public.game_sessions for select
  using (auth.uid() = user_id);

create policy "Insertion propres sessions game"
  on public.game_sessions for insert
  with check (auth.uid() = user_id);

create policy "Suppression propres sessions game"
  on public.game_sessions for delete
  using (auth.uid() = user_id);


-- 4. Sessions Échauffement
create table public.warmup_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  zone         jsonb not null,
  total_darts  int not null,
  hits         int not null,
  accuracy     numeric(5,2),
  duration_s   int,
  settings     jsonb default '{}'::jsonb,
  played_at    timestamptz default now()
);

alter table public.warmup_sessions enable row level security;

create policy "Lecture propres sessions warmup"
  on public.warmup_sessions for select
  using (auth.uid() = user_id);

create policy "Insertion propres sessions warmup"
  on public.warmup_sessions for insert
  with check (auth.uid() = user_id);

create policy "Suppression propres sessions warmup"
  on public.warmup_sessions for delete
  using (auth.uid() = user_id);


-- 5. Amitiés
create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Lecture : visible si on est l'un des deux participants
create policy "Lecture propres amitiés"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Insertion : seulement en tant que requester
create policy "Envoi demande d'ami"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Mise à jour : seulement l'addressee peut accepter
create policy "Acceptation demande d'ami"
  on public.friendships for update
  using (auth.uid() = addressee_id);

-- Suppression : les deux participants peuvent supprimer
create policy "Suppression amitié"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);


-- ============================================================
-- Sessions X01 (501 / 301)
-- ============================================================

create table public.x01_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete cascade not null,
  played_at           timestamptz default now(),
  start_score         int not null,
  legs_played         int not null,
  avg_volley          numeric,
  avg_9darts          numeric,
  avg_darts_to_finish numeric,
  min_darts           int,
  max_darts           int,
  highest_finish      int,
  highest_volley      int,
  doubles_hit         int,
  doubles_attempted   int,
  total_darts         int,
  settings            jsonb,
  volley_distribution jsonb,
  leg_averages        jsonb,
  opponent_data       jsonb,
  linked_friend_id    uuid references public.profiles(id) on delete set null
);

alter table public.x01_sessions enable row level security;

create policy "Users manage own x01_sessions"
  on public.x01_sessions for all
  using (auth.uid() = user_id);

-- Migration si la table existe déjà sans les colonnes doubles :
-- alter table public.x01_sessions
--   add column if not exists doubles_hit       int,
--   add column if not exists doubles_attempted  int,
--   add column if not exists total_darts        int;


-- ============================================================
-- Sessions Tactics (fermeture façon cricket, 20→12 puis Double/Triple/Bull)
-- ============================================================

create table public.tactics_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  played_at    timestamptz default now(),
  legs_played  int not null,
  total_darts  int,
  avg_darts    numeric,
  min_darts    int,
  max_darts    int,
  settings     jsonb
);

alter table public.tactics_sessions enable row level security;

create policy "Users manage own tactics_sessions"
  on public.tactics_sessions for all
  using (auth.uid() = user_id);


-- ============================================================
-- Sessions Checkouts (quiz de révision des finish, 2→170)
-- Seul le quiz noté est persisté (la révision libre est du browsing).
-- ============================================================

create table public.checkout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  played_at     timestamptz default now(),
  questions     int not null,
  correct_count int not null,
  optimal_count int not null default 0,
  best_streak   int not null default 0,
  points        int not null default 0,
  settings      jsonb default '{}'::jsonb
);

alter table public.checkout_sessions enable row level security;

create policy "Users manage own checkout_sessions"
  on public.checkout_sessions for all
  using (auth.uid() = user_id);


-- ============================================================
-- Mode Tournoi (format Bracket) — V2 : hôtes, invitation par code,
-- flow création (pending) → démarrage (in_progress)
-- ============================================================

create table public.tournaments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null, -- créateur
  name                  text not null,
  description           text,
  join_code             text unique, -- généré par trigger, format T-XXXXX
  format                text not null default 'bracket'
                          check (format in ('bracket', 'round_robin', 'championship')),
  start_score           int not null,
  legs_to_win           int not null,
  seeding_method        text check (seeding_method in ('random', 'manual')), -- choisi au démarrage
  double_elimination    boolean default false,                                -- choisi au démarrage
  player_count          int not null default 0,
  status                text not null default 'pending'
                          check (status in ('pending', 'in_progress', 'completed')),
  winner_participant_id uuid,
  created_at            timestamptz default now(),
  completed_at          timestamptz
);

create table public.tournament_hosts (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  role          text not null default 'host' check (role in ('creator', 'host')),
  added_by      uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  unique(tournament_id, user_id)
);

create table public.tournament_participants (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid references public.tournaments(id) on delete cascade not null,
  seed             int, -- assigné seulement au démarrage du tournoi
  user_id          uuid references auth.users(id) on delete set null, -- rempli si auto-inscription
  player_data      jsonb not null, -- { id, name, isMe?, isFriend?, isRegistered?, isGuest? }
  linked_friend_id uuid references public.profiles(id) on delete set null,
  created_at       timestamptz default now(),
  unique(tournament_id, seed)
);

alter table public.tournaments
  add constraint tournaments_winner_fk
  foreign key (winner_participant_id) references public.tournament_participants(id) on delete set null;

create table public.tournament_matches (
  id                     uuid primary key default gen_random_uuid(),
  tournament_id          uuid references public.tournaments(id) on delete cascade not null,
  round                  int not null,
  bracket_type           text not null default 'winner' check (bracket_type in ('winner', 'loser', 'grand_final')),
  slot_in_round          int not null,
  player1_participant_id uuid references public.tournament_participants(id) on delete set null,
  player2_participant_id uuid references public.tournament_participants(id) on delete set null,
  winner_participant_id  uuid references public.tournament_participants(id) on delete set null,
  status                 text not null default 'pending'
                           check (status in ('pending', 'ready', 'bye', 'completed')),
  next_match_id          uuid references public.tournament_matches(id) on delete set null,
  next_match_slot        int check (next_match_slot in (1, 2)),
  loser_next_match_id    uuid references public.tournament_matches(id) on delete set null,
  loser_next_match_slot  int check (loser_next_match_slot in (1, 2)),
  created_at             timestamptz default now(),
  played_at              timestamptz,
  unique(tournament_id, bracket_type, round, slot_in_round)
);

alter table public.x01_sessions
  add column if not exists tournament_id       uuid references public.tournaments(id) on delete set null,
  add column if not exists tournament_match_id uuid references public.tournament_matches(id) on delete set null;

create index if not exists idx_x01_sessions_tournament_match on public.x01_sessions(tournament_match_id);
create index if not exists idx_tournament_participants_tournament on public.tournament_participants(tournament_id);
create index if not exists idx_tournament_participants_user on public.tournament_participants(user_id);
create index if not exists idx_tournament_matches_tournament on public.tournament_matches(tournament_id);
create index if not exists idx_tournament_hosts_tournament on public.tournament_hosts(tournament_id);
create index if not exists idx_tournament_hosts_user on public.tournament_hosts(user_id);

alter table public.tournaments             enable row level security;
alter table public.tournament_hosts        enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_matches      enable row level security;

-- Évite la récursion de policy en lisant tournament_hosts depuis une policy sur cette table
create or replace function public.is_tournament_host(t_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tournament_hosts h
    where h.tournament_id = t_id and h.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_tournament_host(uuid) from public, anon;
grant execute on function public.is_tournament_host(uuid) to authenticated;

-- Idem pour un check "suis-je participant" : sert dans une policy SUR
-- tournament_participants elle-même (voir plus bas), donc doit être
-- SECURITY DEFINER pour éviter une récursion infinie de policy.
create or replace function public.is_tournament_participant(t_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tournament_participants p
    where p.tournament_id = t_id and p.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_tournament_participant(uuid) from public, anon;
grant execute on function public.is_tournament_participant(uuid) to authenticated;

-- INSERT à part : au moment de la création, aucune ligne tournament_hosts
-- n'existe encore pour ce tournoi (elle est insérée juste après) donc
-- is_tournament_host(id) serait toujours faux ici — on autorise via user_id.
create policy "Creator can insert tournaments"
  on public.tournaments for insert
  with check (auth.uid() = user_id);

-- Le créateur doit toujours voir son propre tournoi via user_id (pas seulement
-- via tournament_hosts) : juste après l'INSERT, insert(...).select() fait un
-- RETURNING soumis aux policies SELECT, avant que la ligne tournament_hosts
-- n'existe (elle est créée par l'appel suivant).
create policy "Creator can read own tournaments"
  on public.tournaments for select using (auth.uid() = user_id);

-- Hôtes : lecture/mise à jour/suppression sur leur tournoi (une fois la ligne
-- tournament_hosts créée)
create policy "Hosts select their tournaments"
  on public.tournaments for select using (public.is_tournament_host(id));
create policy "Hosts update their tournaments"
  on public.tournaments for update
  using (public.is_tournament_host(id)) with check (public.is_tournament_host(id));
create policy "Hosts delete their tournaments"
  on public.tournaments for delete using (public.is_tournament_host(id));

-- Participants : lecture seule sur les tournois où ils sont inscrits
create policy "Participants read their tournaments"
  on public.tournaments for select
  using (public.is_tournament_participant(id));

create policy "Hosts read host list"
  on public.tournament_hosts for select using (public.is_tournament_host(tournament_id));

create policy "Participants read host list"
  on public.tournament_hosts for select using (public.is_tournament_participant(tournament_id));

-- Un hôte existant peut en ajouter un autre ; sinon le créateur du tournoi
-- (tournaments.user_id) peut s'auto-ajouter comme premier hôte à la création,
-- avant qu'aucune ligne tournament_hosts n'existe encore pour ce tournoi.
create policy "Hosts add co-hosts"
  on public.tournament_hosts for insert
  with check (
    public.is_tournament_host(tournament_id)
    or (
      user_id = auth.uid()
      and exists (select 1 from public.tournaments t where t.id = tournament_id and t.user_id = auth.uid())
    )
  );

create policy "Hosts remove co-hosts"
  on public.tournament_hosts for delete using (public.is_tournament_host(tournament_id));

create policy "Hosts manage participants"
  on public.tournament_participants for all
  using (public.is_tournament_host(tournament_id))
  with check (public.is_tournament_host(tournament_id));

create policy "Participants read roster"
  on public.tournament_participants for select
  using (public.is_tournament_participant(tournament_id));

-- Auto-inscription / départ, indépendants des droits hôte
create policy "Self-service join"
  on public.tournament_participants for insert with check (user_id = auth.uid());
create policy "Self-service leave"
  on public.tournament_participants for delete using (user_id = auth.uid());

-- Scoring réservé aux hôtes (jeu en pass-and-play local sur l'appareil de l'hôte)
create policy "Hosts manage matches"
  on public.tournament_matches for all
  using (public.is_tournament_host(tournament_id))
  with check (public.is_tournament_host(tournament_id));

create policy "Participants read matches"
  on public.tournament_matches for select
  using (public.is_tournament_participant(tournament_id));

-- ── Rejoindre par code ───────────────────────────────────────────────────────

create or replace function public.find_tournament_by_join_code(code text)
returns table (
  id uuid, name text, description text, host_name text,
  participant_count int, status text
)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.description,
         coalesce(p.username, p.first_name, 'Hôte') as host_name,
         (select count(*) from public.tournament_participants tp where tp.tournament_id = t.id)::int,
         t.status
  from public.tournaments t
  join public.tournament_hosts h on h.tournament_id = t.id and h.role = 'creator'
  left join public.profiles p on p.id = h.user_id
  where t.join_code = upper(code)
  limit 1;
$$;
grant execute on function public.find_tournament_by_join_code(text) to authenticated, anon;

create or replace function public.join_tournament_by_code(code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t_id uuid;
  t_status text;
  joined_id uuid;
begin
  select id, status into t_id, t_status from public.tournaments where join_code = upper(code);
  if t_id is null then
    raise exception 'Code de tournoi invalide';
  end if;
  if t_status <> 'pending' then
    raise exception 'Ce tournoi a déjà démarré';
  end if;

  insert into public.tournament_participants (tournament_id, user_id, player_data)
  values (
    t_id, auth.uid(),
    jsonb_build_object(
      'id', auth.uid(),
      'name', (select coalesce(username, first_name, 'Joueur') from public.profiles where id = auth.uid()),
      'isRegistered', true
    )
  )
  on conflict do nothing
  returning tournament_id into joined_id;

  return coalesce(joined_id, t_id);
end;
$$;
grant execute on function public.join_tournament_by_code(text) to authenticated;

-- Génération automatique du join_code à la création
create or replace function public.generate_tournament_join_code()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  new_code text;
  code_exists boolean;
begin
  if new.join_code is not null then
    return new;
  end if;
  loop
    new_code := 'T-' || upper(substring(md5(random()::text) from 1 for 5));
    select exists(select 1 from public.tournaments where join_code = new_code) into code_exists;
    exit when not code_exists;
  end loop;
  new.join_code := new_code;
  return new;
end;
$$;
revoke execute on function public.generate_tournament_join_code() from public, anon, authenticated;

create trigger before_tournament_insert
  before insert on public.tournaments
  for each row execute procedure public.generate_tournament_join_code();

-- Realtime : nécessaire pour la pastille "nouveau tournoi" sur la nav (tournamentStore
-- s'abonne aux changements de tournament_participants pour l'utilisateur courant).
-- Par défaut seule la table publiée explicitement reçoit les événements postgres_changes.
alter publication supabase_realtime add table public.tournament_participants;
alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.tournament_hosts;
