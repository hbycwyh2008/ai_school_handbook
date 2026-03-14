## Context

The codebase is currently a single `index.html` file (~1350 lines) with all logic in vanilla JS using `localStorage` for persistence. There is no server, no user separation, and no access control.

New requirements: persistent PostgreSQL storage, Google OAuth 2.0 login for both teacher and students, and a teacher-controlled invite-link flow for student account creation.

The app will be deployed to Render (existing `render.yaml` template), which offers a managed PostgreSQL add-on.

## Goals / Non-Goals

**Goals:**
- PostgreSQL for all persistent data (users, students, tests, scores, invite tokens)
- Google OAuth 2.0 as the primary login method for both teacher and students
- Username + password retained as a fallback for the teacher account only
- Invite-link flow: teacher generates per-student links; student opens link and signs in with Google to complete registration
- JWT-based sessions after auth (stateless API); no server-side session store needed for normal requests
- Preserve the existing visual design exactly

**Non-Goals:**
- No self-registration (students cannot sign up without an invite link)
- No email/SMS verification beyond Google's own identity
- No HTTPS/TLS setup in code (handled at Render's proxy layer)
- No real-time updates or WebSockets

## Decisions

### 1. PostgreSQL over JSON file storage

**Choice:** PostgreSQL via the `pg` Node.js client with a plain SQL schema file (`db/schema.sql`).

**Rationale:** The app targets Render deployment where Postgres is a first-class add-on. A relational schema naturally models the `users → students → tests` hierarchy with referential integrity. JSON file storage would be fragile on ephemeral Render instances.

**Alternative considered:** SQLite (`better-sqlite3`) — rejected because Render's filesystem is ephemeral; data would be lost on each deploy.

**Alternative considered:** Prisma ORM — rejected to keep the dependency surface minimal; raw `pg` is straightforward for this schema size.

### 2. Google OAuth 2.0 via Passport.js

**Choice:** `passport` + `passport-google-oauth20` strategy. After successful OAuth, a JWT is issued and delivered to the client via URL query parameter (`?auth_token=<jwt>`), then immediately stripped from the URL by the frontend.

**Rationale:** Passport is the de-facto standard for Node OAuth. Delivering the JWT via redirect query param is simple, stateless, and avoids the need for `express-session` for normal API calls.

**State parameter for invite flow:** When a student opens an invite link (`/invite/:token`), the frontend initiates the Google OAuth flow with `state=invite::<token>`. The callback handler reads the state, validates the invite, creates the user account linked to the pre-created student profile, and marks the invite as used.

**Alternative considered:** `express-session` cookie-based sessions — rejected because it requires a session store (Redis or DB table) and complicates the stateless JWT design.

### 3. Two auth pathways, one JWT format

After successful authentication by either method, the server issues the same JWT structure:
```json
{ "id": "<user_id>", "role": "teacher|student", "displayName": "...", "studentId": "..." }
```
Both `POST /api/auth/login` (password) and `GET /api/auth/google/callback` (OAuth) converge to this token. The frontend only ever sees JWTs — it does not know or care which auth method was used.

### 4. Teacher account bootstrap

**Choice:** Teacher's Google email and/or username+password are defined in `.env`. On first start, the server upserts the teacher account.

**Rationale:** The teacher is a single known individual. Pre-configuring their identity in environment variables is simpler than an admin setup wizard, and avoids storing teacher credentials in the database in a way that could be leaked.

### 5. Invite token design

**Choice:** A 48-character cryptographically random hex token stored in `invite_tokens` table with a 7-day expiry. One-time use (marked `used_at` once claimed). The invite URL is `<base_url>/invite/<token>`.

**Rationale:** Short enough to share via message, secure enough to prevent guessing. Teacher can regenerate if the link expires.

### 6. Score auto-save with 600 ms debounce

No change from original design. Score inputs debounce `PUT /api/students/:id/tests/:idx` after 600 ms. Scores are stored as `NUMERIC(5,2)` in PostgreSQL.

### 7. Viewer links (行政老师 / 申请老师)

**Choice:** Teacher creates named "viewer links". Each link has a long-lived token and a set of student IDs. Anyone who opens the URL (e.g. `/view/link/<token>`) gets a read-only page: student selector limited to those students, same report/charts UI, no edit controls and no login.

**Rationale:** 行政/申请老师 only need to see specified students; the link itself is the credential. No separate accounts or passwords.

**Schema:** `viewer_links` (id, token, name, created_by, created_at), `viewer_link_students` (viewer_link_id, student_id). One token per link; teacher can create multiple links (e.g. one for 行政, one for 申请) with different student sets.

### 8. Student share links (给学生，免注册)

**Choice:** Teacher generates a "share link" per student. URL e.g. `/view/student/<token>`. Public endpoint `GET /api/share/:token` returns that one student's data. No login; token is the only auth. Optional expiry (e.g. 30 days) so links can be revoked by time.

**Rationale:** Students or parents can view one report without registering; teacher controls exactly which content is visible.

**Schema:** `share_links` (id, token, student_id, created_by, expires_at, created_at). One token per student share; teacher can regenerate (new token) to invalidate the old link.

## Database Schema

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE,
  username    TEXT UNIQUE,
  password_hash TEXT,          -- nullable: Google-only accounts have no password
  google_id   TEXT UNIQUE,     -- nullable: password-only accounts have no Google ID
  display_name TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  grade      TEXT DEFAULT '12',
  subject    TEXT DEFAULT 'AP CSA',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  score      NUMERIC(5,2),
  bottom_line INTEGER DEFAULT 84,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewer links: 行政/申请老师 — token grants read-only access to a set of students
CREATE TABLE viewer_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE viewer_link_students (
  viewer_link_id UUID NOT NULL REFERENCES viewer_links(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (viewer_link_id, student_id)
);

-- Student share links: 给学生免注册 — one token = one student, read-only
CREATE TABLE share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

## Risks / Trade-offs

- **Google consent screen approval** → Must configure OAuth consent screen in Google Cloud Console; in testing mode only up to 100 users are allowed before publishing.
- **Concurrent score edits** → Last-write-wins within a single student session; no optimistic locking needed at this class size.
- **Invite link sharing** → Anyone with the link can claim a student account within 7 days. Mitigated by short expiry and teacher ability to delete used/compromised invites.
- **Token in URL briefly** → JWT appears in browser history for a fraction of a second. Mitigated by immediately stripping with `history.replaceState`. Low risk on trusted school devices.

## Migration Plan

1. Provision a PostgreSQL database (Render add-on or local `psql`)
2. Set all required env vars (see `.env.example`)
3. Run `npm run db:init` to execute `db/schema.sql` against the database
4. Start server with `npm start` — teacher account is upserted on first run
5. Teacher logs in, creates student profiles, generates invite links, sends them to students
6. No migration of old `localStorage` data needed

## Open Questions

_(none)_
