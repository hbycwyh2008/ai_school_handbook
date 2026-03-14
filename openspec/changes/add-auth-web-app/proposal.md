## Why

The current app is a single static HTML file with no server or authentication — anyone who opens it can see all students' scores and modify any data. We need to transform it into a proper web app with a PostgreSQL database for persistent storage, JWT-based role authorization, and Google OAuth so that both the teacher and students can sign in with their Google accounts rather than managing separate passwords.

## What Changes

- Add a Node.js/Express backend with a **PostgreSQL** database (hosted on Render or local)
- Add **two auth methods**: username + password (teacher fallback), and **Google OAuth 2.0** (teacher and students)
- Teacher can: create student profiles, generate **invite links** per student, add/remove tests, enter/edit scores
- Students register by opening a teacher-generated invite link and signing in with their Google account; on subsequent visits they use "Sign in with Google" directly
- Students can only view their own read-only score report
- **Viewer links (行政老师 / 申请老师)**: Teacher can create named viewer links and assign which students each link can see. Anyone with the link opens a read-only view of only those students’ scores (no login).
- **Student share links (给学生，免注册)**: Teacher can generate a share link for a single student. Anyone with the link can view that student’s report only; no registration or login required.
- Replace `localStorage` data persistence with server-side REST API calls
- The existing visual design (score table, charts, conversion table) is preserved for all roles and link-based views

## Capabilities

### New Capabilities

- `auth`: Login with username + password (teacher only fallback) or Google OAuth 2.0 (both roles); JWT session tokens; role-based access enforcement (`teacher` | `student`); student invite-link registration flow
- `teacher-dashboard`: Full score management UI (add/delete students with invite link generation, add/delete tests, inline score editing with auto-save); accounts management modal; **viewer links management** (create named links, assign students, copy URL); **student share links** (generate/copy per-student view link, optional expiry)
- `student-dashboard`: Read-only personal score report — tests, scores, charts, estimated AP score; no ability to edit anything
- `viewer-link-view`: Public read-only view for holder of a viewer link — sees only the students the teacher assigned to that link; student selector and report UI; no login
- `student-share-view`: Public read-only view for holder of a student share link — sees one student’s report only; no login or registration

### Modified Capabilities

_(none — greenfield backend on top of the existing HTML design)_

## Impact

- New files: `server.js`, `package.json`, `.env`, `.gitignore`, `db/schema.sql`
- New runtime dependencies: Node.js 18+, a running PostgreSQL instance, Google OAuth credentials
- `index.html` significantly rewritten: login overlay with Google button added; invite-acceptance page added; all data ops replaced with `fetch` API calls; UI conditioned on role
- **BREAKING**: app must be run with `npm start` — opening `index.html` directly no longer works
- **BREAKING**: requires `DATABASE_URL` and `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env vars to be set before starting
