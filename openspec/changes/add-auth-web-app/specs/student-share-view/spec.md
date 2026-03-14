## ADDED Requirements

### Requirement: Holder of a student share link sees one student's report only
When a user opens a student share link URL (e.g. `/view/student/<token>`), the frontend SHALL call a public API (no auth) to load that student's data. The page SHALL display the same report UI (score table, charts, estimated banner, conversion table) for that single student in read-only mode. No login or registration is required.

#### Scenario: Open valid student share link
- **WHEN** user opens a valid share link for student "Jun"
- **THEN** they see Jun's score report only; no student selector; all content read-only

#### Scenario: Expired share link
- **WHEN** user opens a share link whose optional expiry date has passed
- **THEN** API returns 404 or 410; frontend shows "This link has expired"

#### Scenario: Invalid share token
- **WHEN** user opens a URL with an unknown or revoked share token
- **THEN** API returns 404; frontend shows "Invalid link"

### Requirement: Student share view has no edit or navigation controls
The student share view SHALL NOT show: student selector, edit mode, add/delete anything, score editing, or manage accounts. Only screenshot and export JSON for the current report may be offered.

#### Scenario: Read-only single student view
- **WHEN** page is loaded via student share link
- **THEN** only one student's data is visible; score inputs are not editable; no way to switch to other students

### Requirement: Teacher can generate and revoke student share links
From the teacher dashboard (e.g. per student in "Manage Accounts" or from the student toolbar), the teacher SHALL be able to generate a "Share link" for the current student. The link is shown and copied to clipboard. Optional: teacher can set an expiry (e.g. 30 days) or revoke by regenerating (new token invalidates the old one).

#### Scenario: Generate share link for student
- **WHEN** teacher clicks "Share link" for a student and optionally sets expiry
- **THEN** a new share link URL is created (or existing one returned); URL is shown and copied

#### Scenario: Regenerate share link (revoke old)
- **WHEN** teacher clicks "Regenerate share link" for a student who already has one
- **THEN** a new token is created; the old link stops working; new URL is copied
