-- Piano Study Tracker 스키마
-- Supabase 프로젝트의 SQL Editor에서 실행하세요.

-- 프로필
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default '',
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "프로필은 본인만 조회" on profiles for select using (auth.uid() = id);
create policy "프로필은 본인만 수정" on profiles for update using (auth.uid() = id);
create policy "프로필 생성" on profiles for insert with check (auth.uid() = id);

-- 학습 기록
create table if not exists study_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  category text not null check (category in ('theory', 'piece', 'composer', 'progress')),
  title text not null,
  content text default '',
  tags text[] default '{}',
  created_at timestamptz default now()
);

alter table study_notes enable row level security;
create policy "노트는 본인만 조회" on study_notes for select using (auth.uid() = user_id);
create policy "노트는 본인만 생성" on study_notes for insert with check (auth.uid() = user_id);
create policy "노트는 본인만 수정" on study_notes for update using (auth.uid() = user_id);
create policy "노트는 본인만 삭제" on study_notes for delete using (auth.uid() = user_id);

create index idx_study_notes_user on study_notes(user_id);
create index idx_study_notes_category on study_notes(user_id, category);

-- 연습 세션
create table if not exists practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  duration integer not null,
  memo text default '',
  created_at timestamptz default now()
);

alter table practice_sessions enable row level security;
create policy "세션은 본인만 조회" on practice_sessions for select using (auth.uid() = user_id);
create policy "세션은 본인만 생성" on practice_sessions for insert with check (auth.uid() = user_id);
create policy "세션은 본인만 삭제" on practice_sessions for delete using (auth.uid() = user_id);

create index idx_sessions_user on practice_sessions(user_id);

-- 즐겨찾기 곡
create table if not exists saved_pieces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  piece_id text not null,
  rating integer default 0 check (rating >= 0 and rating <= 5),
  memo text default '',
  created_at timestamptz default now(),
  unique(user_id, piece_id)
);

alter table saved_pieces enable row level security;
create policy "즐겨찾기는 본인만 조회" on saved_pieces for select using (auth.uid() = user_id);
create policy "즐겨찾기는 본인만 생성" on saved_pieces for insert with check (auth.uid() = user_id);
create policy "즐겨찾기는 본인만 수정" on saved_pieces for update using (auth.uid() = user_id);
create policy "즐겨찾기는 본인만 삭제" on saved_pieces for delete using (auth.uid() = user_id);

create index idx_saved_pieces_user on saved_pieces(user_id);

-- 새 유저 가입 시 자동 프로필 생성 트리거
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
