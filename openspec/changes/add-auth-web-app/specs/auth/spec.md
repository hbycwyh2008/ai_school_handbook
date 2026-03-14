## ADDED Requirements

### Requirement: User can log in with username and password (teacher only)
The system SHALL provide a username + password login form as a fallback for the teacher account. Upon submitting valid credentials, the server SHALL verify the password hash and issue a 7-day JWT. Students do NOT have passwords and cannot use this form.

#### Scenario: Teacher logs in with correct credentials
- **WHEN** teacher submits correct username and password
- **THEN** server issues a JWT; frontend stores it in localStorage and shows the teacher dashboard

#### Scenario: Wrong password
- **WHEN** teacher submits an incorrect password
- **THEN** server returns HTTP 401; frontend shows "Invalid username or password"

#### Scenario: Student attempts password login
- **WHEN** a username belonging to a student account is submitted
- **THEN** server returns HTTP 401 (students must use Google login)

### Requirement: User can log in with Google OAuth 2.0
The login page SHALL display a "Sign in with Google" button. Clicking it SHALL redirect to Google's OAuth consent screen. After successful consent, Google redirects back to the server callback, which issues a JWT and redirects the browser to `/?auth_token=<jwt>`. The frontend extracts the token, stores it in localStorage, removes it from the URL, and shows the appropriate dashboard.

#### Scenario: Teacher signs in with Google (account already exists)
- **WHEN** teacher clicks "Sign in with Google" and authorises their pre-configured Google account
- **THEN** server finds the user by Google ID, issues a JWT, redirects to app with token

#### Scenario: Teacher signs in with Google (first time)
- **WHEN** teacher's Google account email matches `TEACHER_EMAIL` env var and no user record exists yet
- **THEN** server creates the teacher user account, links the Google ID, issues JWT

#### Scenario: Student signs in with Google (account already exists)
- **WHEN** student who completed registration via invite link clicks "Sign in with Google"
- **THEN** server finds the user by Google ID, issues a JWT, redirects to student dashboard

#### Scenario: Unknown Google account (no invite, not teacher)
- **WHEN** a Google account that has no corresponding user record and is not the teacher's email attempts login
- **THEN** server redirects to `/login?error=no-account`; frontend shows "No account found. Please use your invite link."

### Requirement: Student registers via invite link + Google
When a student opens a valid invite link (`/invite/:token`), the frontend SHALL show an invite acceptance page with a "Sign in with Google to activate your account" button. Clicking it SHALL start the Google OAuth flow with the invite token embedded in the OAuth `state` parameter. After Google consent, the callback validates the invite, creates a user account linked to the pre-created student profile, marks the invite as used, issues a JWT, and redirects to the student dashboard.

#### Scenario: Student successfully claims invite
- **WHEN** student opens a valid, unexpired, unused invite link and completes Google sign-in
- **THEN** a user account is created linked to their student profile; invite is marked used; JWT is issued; student dashboard is shown

#### Scenario: Student uses Google account already linked to their profile (re-visiting invite link)
- **WHEN** student opens an invite link that is already used but their Google account is linked
- **THEN** server recognises the existing account and issues a JWT (treated as a normal login)

#### Scenario: Expired invite link
- **WHEN** student opens an invite link whose `expires_at` is in the past
- **THEN** server responds with an error page showing "This invite link has expired. Please ask your teacher for a new one."

#### Scenario: Invalid invite token
- **WHEN** student opens a URL with a non-existent token
- **THEN** server returns HTTP 404; frontend shows "Invalid invite link."

#### Scenario: Invite link used by a different Google account
- **WHEN** a different Google account (not the originally registered one) tries to claim an already-used invite
- **THEN** server rejects with an error: "This invite has already been claimed by another account."

### Requirement: User can sign out
All authenticated pages SHALL show a "Sign Out" button. Clicking it SHALL clear the JWT from localStorage and redirect to the login page. Sign out is client-side only (JWT is not server-side invalidated).

#### Scenario: Sign out clears session
- **WHEN** authenticated user clicks "Sign Out" and confirms
- **THEN** localStorage token is cleared; login overlay is shown; no further API calls are made

### Requirement: Expired or invalid token is handled gracefully
Any API call that returns HTTP 401 SHALL trigger an automatic redirect to the login page with the localStorage token removed.

#### Scenario: API call with expired JWT
- **WHEN** stored JWT is expired and a fetch call returns 401
- **THEN** token is cleared; login overlay is shown; user sees "Session expired. Please sign in again."

#### Scenario: Page load with expired JWT
- **WHEN** page loads and `GET /api/auth/verify` returns 401
- **THEN** login overlay is shown immediately; no data-fetching calls are attempted

### Requirement: Role-based access control enforced on the server
All API endpoints requiring authentication SHALL validate the JWT. Teacher-only endpoints SHALL return HTTP 403 for student tokens. Students SHALL only retrieve their own data via `GET /api/me`; attempting to access `GET /api/students` returns HTTP 403.

#### Scenario: Student accesses teacher-only endpoint
- **WHEN** valid student JWT is used on `GET /api/students`
- **THEN** server responds HTTP 403

#### Scenario: Unauthenticated API request
- **WHEN** any protected endpoint is called without `Authorization: Bearer` header
- **THEN** server responds HTTP 401
