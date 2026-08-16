# QAL Project Context / AI Handoff

> **Purpose:** Persistent project context for future ChatGPT/AI sessions. Read this file before making changes to QAL. Treat the current Git repository and the confirmed Supabase schema as the source of truth. Do not infer that unfinished features are implemented just because routes/files exist.

## 1. Product identity

**Product:** Quantrix Analytics League (QAL)

**Organization:** Quantrix Analytics Club / college club project.

**Product type:** Gamified analytics-learning web application for MBA/PGDM learners.

**Core idea:** "LeetCode for MBA Analytics" — students learn analytics skills through practical business missions, compete through XP/leaderboards, and grow their skills.

**Core loop:**

`Learn -> Compete -> Grow`

**Product principle:** Practical, beginner-friendly, modular, free/low-cost to operate, and scalable enough to grow beyond the initial MVP.

**Important exclusion:** This repository is for QAL/Quantrix Analytics League. Do not mix it with unrelated projects such as the warehouse digital-twin project.

## 2. Product scope

### MVP / core features

1. Google authentication
2. Student profile
3. Dashboard
4. XP and levels
5. Missions
6. Mission details and submissions
7. Progress tracking
8. Leaderboard
9. Events
10. Admin/content management foundation

### Initial learning topics

- Excel
- Statistics
- SQL
- Power BI
- Python
- AI

### Deferred / later features

These were discussed as later-stage features rather than the first MVP:

- AI Mentor
- Resume Builder
- Certificates
- Knowledge Base

Do not build deferred features before the core mission/progress experience is functional unless the project direction is explicitly changed.

## 3. Technology stack

- Frontend: React 19 + Vite
- Routing: React Router
- Styling: Tailwind CSS
- Backend/database/auth: Supabase + PostgreSQL
- Authentication: Google OAuth through Supabase Auth
- Charts planned: Recharts (not currently installed in the repository)
- Excel processing planned: SheetJS (not currently installed in the repository)
- Deployment target discussed: Vercel
- Source control: Git + GitHub
- Package manager: npm

Current `package.json` confirms React, Vite, React Router, Supabase JS, Tailwind and Oxlint. Recharts and SheetJS are not currently dependencies.

## 4. Current repository state

Repository: `Revanth015/QAL`

Current main-branch checkpoint when this file was created:

- Commit: `feat: connect Google auth to QAL user profiles`
- Main branch was previously confirmed clean and pushed.

### Implemented and verified

#### Development environment

- Repository connected to local VS Code project.
- `npm install` completed successfully.
- Vite development server works.
- `.env` is local and ignored by Git.

#### Supabase connection

`src/config/supabase.js` reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never commit `.env` or any secret key.

#### Google OAuth

Google OAuth is working end-to-end.

Current local redirect in `src/services/authService.js`:

`http://localhost:5173/`

Supabase Authentication URL configuration also includes the local redirect.

**Production note:** the hard-coded localhost redirect must be replaced/extended with the production URL before deployment.

#### Auth state

`src/contexts/AuthContext.jsx`:

- loads the current Supabase session
- listens for `onAuthStateChange`
- exposes `{ session, loading }` through `useAuth()`

`src/main.jsx` wraps the application in `AuthProvider`.

#### QAL user profile integration

`src/services/userService.js` retrieves the authenticated user's row from `public.users`.

The browser initially returned zero rows because RLS was enabled with no SELECT policy. The required policy was added in Supabase:

```sql
create policy "Users can view their own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);
```

After this policy, the browser query returned one row and confirmed the QAL profile data, including `full_name`, XP, level and mission count.

A trigger/function was also created in Supabase to create a `public.users` row for new `auth.users` records. The existing Google user was backfilled manually because the user already existed before the trigger was created.

**Important:** These Supabase SQL changes are external to Git unless SQL migrations are later added to the repository. Future AI sessions should not assume the database can be recreated from the repo alone.

### Current known UI issue

At the last development checkpoint, the Supabase profile query successfully returned a row containing `full_name: "Revanth Revanth"`, but the Home page UI was still being checked because the name was not visibly rendering. The database/query/RLS issue is resolved; the remaining investigation is frontend rendering/state if the issue persists.

Do not redo the OAuth/database setup just because the name display issue appears.

## 5. Current frontend structure

Current important files include:

```text
src/
  App.jsx
  main.jsx
  contexts/
    AuthContext.jsx
  config/
    supabase.js
  components/
    Layout.jsx
    Navbar.jsx
  pages/
    Home.jsx
    Login.jsx
    Dashboard.jsx
    Missions.jsx
    Leaderboard.jsx
    Profile.jsx
  services/
    authService.js
    userService.js
    missionService.js
    leaderboardService.js
  hooks/
    useAuth.js
  lib/
    excelEngine.js
    xpEngine.js
```

### Important implementation status

- `Login.jsx`: Google login button works.
- `Home.jsx`: now loads the authenticated QAL profile and displays email/XP/level/missions; still needs final UI polish and verification of name rendering.
- `Dashboard.jsx`: placeholder page only.
- `Missions.jsx`: placeholder page only.
- `Leaderboard.jsx`: placeholder page only.
- `Profile.jsx`: placeholder page only.
- `missionService.js`: currently empty.
- `leaderboardService.js`: currently empty.
- `excelEngine.js`: currently empty.
- `xpEngine.js`: currently empty.
- `useAuth.js`: currently empty; authentication is currently consumed through `AuthContext`.

Routes currently exist for `/`, `/login`, `/dashboard`, `/missions`, `/leaderboard`, and `/profile`, but the non-login pages are not yet protected by an auth guard.

## 6. Confirmed Supabase database schema

The following six unique public tables were confirmed during development.

### `users`

```sql
create table public.users (
  id uuid not null default auth.uid(),
  full_name text not null,
  email text null,
  avatar_url text null,
  total_xp bigint null default '0'::bigint,
  level integer null default 1,
  streak integer null default 0,
  missions_completed integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id)
);
```

### `topics`

```sql
create table public.topics (
  id bigint generated always as identity not null,
  name text not null,
  description text null,
  icon text null,
  color text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint topics_pkey primary key (id),
  constraint topics_name_key unique (name)
);
```

### `missions`

```sql
create table public.missions (
  id bigint generated always as identity not null,
  topic_id bigint null,
  title text not null,
  description text null,
  difficulty text null,
  xp_reward integer null default 100,
  excel_file text null,
  deadline timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint missions_pkey primary key (id),
  constraint missions_topic_id_fkey foreign key (topic_id) references topics (id) on delete cascade
);
```

### `submissions`

```sql
create table public.submissions (
  id bigint generated always as identity not null,
  user_id uuid null,
  mission_id bigint null,
  submission_file text null,
  score integer null default 0,
  feedback text null,
  status text null default 'Pending'::text,
  submitted_at timestamp with time zone null default now(),
  constraint submissions_pkey primary key (id),
  constraint submissions_mission_id_fkey foreign key (mission_id) references missions (id) on delete cascade,
  constraint submissions_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);
```

### `leaderboard`

```sql
create table public.leaderboard (
  user_id uuid not null,
  total_xp integer null default 0,
  missions_completed integer null default 0,
  last_updated timestamp with time zone null default now(),
  constraint leaderboard_pkey primary key (user_id),
  constraint leaderboard_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);
```

### `events`

```sql
create table public.events (
  id bigint generated always as identity not null,
  title text not null,
  description text null,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint events_pkey primary key (id)
);
```

### Database relationship summary

```text
users ───────< submissions >────── missions >────── topics
  │
  └──────────── leaderboard

 events   (independent event table)
```

The current schema does **not** show separate `student_progress` or `topic_progress` tables. Progress currently has aggregate fields on `users` (`total_xp`, `level`, `streak`, `missions_completed`). If detailed progress tracking is needed, design it deliberately rather than assuming such tables already exist.

## 7. Product architecture direction

Target architecture:

```text
Google Auth
    ↓
Supabase Auth
    ↓
QAL users profile
    ↓
Student Dashboard
    ├── XP / Level / Streak
    ├── Topic progress
    ├── Active missions
    ├── Submission status
    └── Leaderboard position

Topics
    ↓
Missions
    ↓
Submissions
    ↓
Scoring / XP
    ↓
User + Leaderboard updates
```

## 8. Planned mission workflow

1. Admin/content manager creates a topic.
2. Admin creates a mission under a topic.
3. Student opens Missions.
4. Student reads mission instructions.
5. Student downloads/uses the relevant Excel file when supplied.
6. Student submits their work.
7. Submission is stored in `submissions` with status/score/feedback.
8. Evaluation/scoring updates the student's XP and mission count.
9. Leaderboard reflects updated performance.

The current repository has the database structure for this workflow, but the frontend/services for missions and scoring are not implemented yet.

## 9. Security / environment rules

- Never commit `.env`.
- Never put Supabase secret keys in frontend code.
- The browser should use the Supabase publishable/anon-style client key intended for frontend use.
- Keep RLS enabled.
- Add explicit RLS policies for each table as features are implemented.
- Do not disable RLS merely to make a frontend query work.
- Use `auth.uid()` to scope student-owned data.

## 10. Current next development priorities

Recommended order based on the actual state of the repository:

### Priority 1 — Finish authenticated student shell

- Resolve/verify Home name rendering.
- Add a proper authenticated route guard.
- Add logout.
- Make Navbar reflect logged-in state.

### Priority 2 — Build the real Dashboard

Use the existing `users` profile fields first:

- full name/avatar
- XP
- level
- streak
- missions completed

Then add live mission/topic information from Supabase.

### Priority 3 — Implement Missions

- Fetch active topics/missions.
- Mission cards.
- Mission detail page.
- Submission workflow.
- Submission status.

### Priority 4 — Implement scoring/XP

- Define XP rules clearly.
- Update `users.total_xp`, `level`, `streak`, `missions_completed` safely.
- Synchronize leaderboard data.

### Priority 5 — Leaderboard

- Fetch leaderboard rows.
- Rank users.
- Show current student's position.

### Priority 6 — Admin/content management

- Topic creation/editing.
- Mission creation/editing.
- File management.
- Submission review/scoring.

## 11. Development workflow for future AI sessions

Before modifying code:

1. Read this file.
2. Inspect the relevant current files in GitHub/local repo.
3. Check the actual Supabase schema/policies when a database change is involved.
4. Do not recreate tables that already exist.
5. Make one coherent change at a time.
6. Run/test locally.
7. Remove temporary debugging code.
8. Commit a meaningful checkpoint to Git.

When debugging, prefer identifying the exact layer first:

`UI -> React state -> service -> Supabase client -> RLS -> database`

Do not repeatedly change database/auth configuration when the error is demonstrably in another layer.

## 12. Last known verified state

At the end of the authentication/profile work:

- Google OAuth login: **working**
- OAuth redirect to local QAL: **working**
- Supabase session: **working**
- `auth.users` record: **working**
- corresponding `public.users` record: **working**
- RLS SELECT policy for own user profile: **working**
- browser profile query: **working; returns one row**
- profile row contains the expected Google-derived name/email/avatar and initial XP/level values
- Home profile display: **name rendering still needed final verification**
- dashboard/missions/leaderboard/profile pages: **mostly placeholders**

This file is the handoff document. Update it when a major architecture, schema, or product-status change is completed.