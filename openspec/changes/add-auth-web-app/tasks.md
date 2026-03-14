## 1. Project Setup

- [ ] 1.1 Create `package.json` with dependencies: `express`, `pg`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `passport`, `passport-google-oauth20`, `cors`
- [ ] 1.2 Create `.env` with `PORT`, `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `TEACHER_EMAIL`, `TEACHER_USERNAME`, `TEACHER_PASSWORD`, `BASE_URL`
- [ ] 1.3 Create `.env.example` with all keys documented but no real values
- [ ] 1.4 Create `.gitignore` excluding `node_modules/`, `.env`, `data/`
- [ ] 1.5 Run `npm install` to install all dependencies

## 2. Database Schema

- [ ] 2.1 Create `db/schema.sql` with tables: `users`, `students`, `invite_tokens`, `tests`, `viewer_links`, `viewer_link_students`, `share_links` (see design.md for full SQL)
- [ ] 2.2 Create `npm run db:init` script in `package.json` that runs `db/schema.sql` against `DATABASE_URL`
- [ ] 2.3 Create `db/index.js` that exports a `query(sql, params)` function using a `pg.Pool` connected to `DATABASE_URL`
- [ ] 2.4 Test database connection locally (or with Render Postgres)

## 3. Backend — Teacher Bootstrap

- [ ] 3.1 On server start, upsert the teacher account using `TEACHER_EMAIL`, `TEACHER_USERNAME`, `TEACHER_PASSWORD` from env; log to console if created
- [ ] 3.2 Add `genToken()` utility using `crypto.randomBytes(24).toString('hex')` for 48-char invite tokens

## 4. Backend — Auth Middleware

- [ ] 4.1 Implement `requireAuth(req, res, next)` middleware — validates `Authorization: Bearer` JWT; attaches `req.user`
- [ ] 4.2 Implement `requireTeacher(req, res, next)` middleware — rejects non-teacher tokens with HTTP 403

## 5. Backend — Password Auth Route

- [x] 5.1 Implement `POST /api/auth/login` — verify username + password with bcrypt; reject student accounts; issue 7-day JWT

## 6. Backend — Google OAuth Routes

- [ ] 6.1 Configure `passport-google-oauth20` strategy with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`; request scopes: `profile`, `email`
- [ ] 6.2 Implement `GET /api/auth/google` — initiates OAuth; passes `state` query param (e.g., `login` or `invite::<token>`) to Google
- [ ] 6.3 Implement Google strategy verify callback:
  - Look up user by `google_id` first, then by `email`
  - If found: update `google_id` if missing; return user
  - If email matches `TEACHER_EMAIL`: create teacher account; return user
  - If `state` starts with `invite::`: validate invite token → create student user account → mark invite used → return user
  - Else: return `false` (no account)
- [ ] 6.4 Implement `GET /api/auth/google/callback` — on success: issue JWT, redirect to `/?auth_token=<jwt>`; on failure: redirect to `/login?error=<reason>`
- [ ] 6.5 Implement `GET /api/auth/verify` — validates token and returns user payload (used by frontend on page load)

## 7. Backend — Invite Token Routes

- [ ] 7.1 Implement `POST /api/students/:id/invite` (teacher only) — generate or replace invite token; set 7-day expiry; return full invite URL
- [ ] 7.2 Implement `GET /api/invite/:token` — return invite metadata (student name, expiry, used status) for the frontend invite page; return 404 for unknown tokens

## 8. Backend — Student Management Routes (Teacher Only)

- [ ] 8.1 Implement `GET /api/students` — return all students with registration status (has linked user? user's email?)
- [ ] 8.2 Implement `POST /api/students` — create student profile (name, grade, subject); no user account created at this stage
- [ ] 8.3 Implement `PUT /api/students/:id` — update name/grade/subject
- [ ] 8.4 Implement `DELETE /api/students/:id` — cascade delete student, linked user, tests, invite tokens

## 9. Backend — Test & Score Routes (Teacher Only)

- [ ] 9.1 Implement `POST /api/students/:id/tests` — insert test row with `position = MAX(position)+1`
- [ ] 9.2 Implement `PUT /api/students/:id/tests/:testId` — update name/score/bottom_line for a test
- [ ] 9.3 Implement `DELETE /api/students/:id/tests/:testId` — delete test; reject if it is the student's last test

## 10. Backend — Student Self-View Route

- [x] 10.1 Implement `GET /api/me` — return the student profile + tests (ordered by `position`) linked to the JWT's user ID; reject teacher tokens with HTTP 400

## 11. Backend — User Management Route (Teacher Only)

- [x] 11.1 Implement `GET /api/users` — return users list (id, display_name, email, role, student_id) without password hashes

## 11b. Backend — Viewer Links (Teacher Only) & Public View

- [ ] 11b.1 Implement `GET /api/viewer-links` (teacher only) — return list of viewer links with id, token, name, studentIds
- [ ] 11b.2 Implement `POST /api/viewer-links` (teacher only) — body `{ name, studentIds }`; create link and assign students; return full URL
- [ ] 11b.3 Implement `PUT /api/viewer-links/:id` (teacher only) — update name and/or studentIds
- [ ] 11b.4 Implement `DELETE /api/viewer-links/:id` (teacher only)
- [ ] 11b.5 Implement `GET /api/view/link/:token` (public, no auth) — return `{ name, students: [{ id, name, grade, subject, tests }] }`; 404 if invalid

## 11c. Backend — Student Share Links & Public Share View

- [ ] 11c.1 Implement `POST /api/students/:id/share` (teacher only) — create or get existing share link; optional expires_at; return full URL
- [ ] 11c.2 Implement `POST /api/students/:id/share/regenerate` (teacher only) — new token, old one invalidated; return new URL
- [ ] 11c.3 Implement `GET /api/share/:token` (public, no auth) — return one student's profile + tests; 404 if invalid/expired

## 12. Frontend — Login Page

- [ ] 12.1 Add full-screen login overlay HTML with: username/password form, "Sign in with Google" button, and error message area
- [ ] 12.2 Style login card consistent with the blue gradient header
- [ ] 12.3 Implement `handlePasswordLogin()` — POST to `/api/auth/login`; store JWT; call `initApp()`
- [ ] 12.4 Implement Google sign-in button — navigates to `/api/auth/google?state=login`
- [ ] 12.5 On page load: check URL for `?auth_token=<jwt>` (OAuth callback redirect); if found, store and strip from URL; then call `initApp()`
- [ ] 12.6 On page load: check URL for `?error=<reason>` (OAuth failure redirect); if found, show appropriate error on login overlay
- [ ] 12.7 Implement `checkExistingAuth()` — call `GET /api/auth/verify`; call `initApp()` if valid; show login overlay if not

## 13. Frontend — Invite Acceptance Page

- [ ] 13.1 On page load, detect if path matches `/invite/:token`; if so, call `GET /api/invite/:token`
- [ ] 13.2 Show invite acceptance screen with student name, expiry date, and "Sign in with Google to activate" button
- [ ] 13.3 Google button navigates to `/api/auth/google?state=invite::<token>`
- [ ] 13.4 Handle invite error states: expired, invalid, already-used — show appropriate message

## 14. Frontend — Auth Infrastructure

- [ ] 14.1 Implement `api(method, url, body)` helper — adds `Authorization: Bearer` header; on 401 clears token and shows login
- [ ] 14.2 Implement `initApp()` — sets auth bar (name, role badge, sign out); applies role CSS class; branches to teacher or student view
- [ ] 14.3 Implement `doLogout()` — clear localStorage token, show login overlay
- [ ] 14.4 Programmatically hide teacher-only controls when role is `student`

## 15. Frontend — Teacher Dashboard

- [ ] 15.1 Connect student dropdown to `GET /api/students`; map each student's tests from response
- [ ] 15.2 Update "Add Student" modal — collect name/grade/subject only (no username/password); POST to `/api/students`
- [ ] 15.3 Wire "Delete Student" to `DELETE /api/students/:id`
- [ ] 15.4 Debounce student info field changes to `PUT /api/students/:id` after 600 ms
- [ ] 15.5 Remove password requirement from edit-mode toggle (already authenticated)
- [ ] 15.6 Wire "+ Add Test" to `POST /api/students/:id/tests` (use test `id` instead of array index in all API calls)
- [ ] 15.7 Wire test delete button to `DELETE /api/students/:id/tests/:testId`
- [ ] 15.8 Debounce score input changes to `PUT /api/students/:id/tests/:testId` with "Saving… / Saved ✓" indicator
- [ ] 15.9 Wire "Reset Scores" to batch PUT calls setting all scores to `null`
- [ ] 15.10 Implement "Manage Accounts" modal — fetch `GET /api/users` + `GET /api/students`; show registration status; wire "Generate Invite Link" to `POST /api/students/:id/invite`; copy link to clipboard on generate
- [ ] 15.11 Implement "Viewer Links" (行政/申请老师链接) modal — list/create/edit/delete viewer links; create with name + multi-select students; copy URL; update student set for existing link
- [ ] 15.12 Add "Share link" (给学生) per student — button/modal to generate or copy share link for current student; optional regenerate to revoke old link

## 15d. Frontend — Viewer Link View (no login)

- [ ] 15d.1 On load, detect path `/view/link/:token`; call `GET /api/view/link/:token`; if 404 show error page
- [ ] 15d.2 Render read-only report UI with student selector limited to returned students; same charts/banner/table; no edit controls; optional screenshot/export

## 15e. Frontend — Student Share View (no login)

- [ ] 15e.1 On load, detect path `/view/student/:token`; call `GET /api/share/:token`; if 404/410 show "Invalid or expired link"
- [ ] 15e.2 Render single-student read-only report; no selector; no edit controls; optional screenshot/export

## 16. Frontend — Student Dashboard

- [ ] 16.1 Implement `initStudentView()` — fetch `GET /api/me`; populate tests array; set welcome banner (name + subject)
- [ ] 16.2 Render all score inputs as `readonly` for student role
- [ ] 16.3 Confirm teacher-only toolbar buttons are absent for student role
- [ ] 16.4 Verify charts, estimated banner, and conversion table display correctly

## 17. Frontend — Polish

- [ ] 17.1 Add `showToast(msg, type)` helper for success/error/info feedback
- [ ] 17.2 Show empty state when teacher has no students yet
- [ ] 17.3 Close modals on backdrop click
- [ ] 17.4 Remove all `localStorage`-based data persistence except `ap_auth_token`
- [ ] 17.5 Remove old `EDIT_PASSWORD` constant and share-link (`#s=`) URL logic

## 18. Deployment Setup

- [ ] 18.1 Create `render.yaml` defining a web service (`npm start`) and a PostgreSQL add-on
- [ ] 18.2 Create `README.md` with: local setup instructions, required env vars, Google OAuth setup steps (Cloud Console), first-run teacher login instructions

## 19. Verification

- [ ] 19.1 Teacher password login → full CRUD works end-to-end
- [ ] 19.2 Teacher Google login → correct dashboard shown
- [ ] 19.3 Student invite link → Google OAuth → student dashboard (read-only)
- [ ] 19.4 Student subsequent Google login → works without invite link
- [ ] 19.5 Unknown Google account → correct "no account" error
- [ ] 19.6 Expired invite → correct error shown
- [ ] 19.7 Student token on `GET /api/students` → HTTP 403
- [ ] 19.8 Expired JWT → redirect to login with "session expired" message
