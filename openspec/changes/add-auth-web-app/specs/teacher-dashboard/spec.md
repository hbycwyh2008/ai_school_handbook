## ADDED Requirements

### Requirement: Teacher sees all students and can switch between them
The teacher dashboard SHALL show a student selector dropdown listing all students. Selecting a student SHALL load their profile and test data. The currently selected student's name, grade, and subject SHALL be editable when edit mode is active.

#### Scenario: Switch to a different student
- **WHEN** teacher selects a different student from the dropdown
- **THEN** the score table, charts, and estimated banner update to show that student's data

#### Scenario: No students exist yet
- **WHEN** teacher has not yet added any students
- **THEN** an empty state is shown with instructions to add a student

### Requirement: Teacher can add a new student profile
When edit mode is active, the teacher SHALL be able to open an "Add Student" modal. The modal SHALL collect: student name, grade, and subject. Submitting creates the student profile in PostgreSQL. No username or password is set at this stage — the student will register via invite link.

#### Scenario: Successfully add a student
- **WHEN** teacher fills in student name and submits
- **THEN** new student appears in the selector; their empty score table is shown; a success toast is displayed

#### Scenario: Missing student name
- **WHEN** teacher submits the modal with name empty
- **THEN** inline error is shown; no record is created

### Requirement: Teacher can generate and share an invite link for a student
For any student who does not yet have a linked user account, the teacher SHALL be able to generate an invite link from the "Manage Accounts" modal. The link is valid for 7 days and is single-use. The teacher can copy the link and send it to the student. If the link expires, the teacher can generate a new one.

#### Scenario: Generate invite link
- **WHEN** teacher clicks "Generate Invite Link" for a student without an account
- **THEN** a unique invite URL is created in the database, shown in the modal, and copied to clipboard automatically

#### Scenario: Regenerate after expiry
- **WHEN** teacher generates a new invite for a student who already has an expired/unused invite
- **THEN** the old token is replaced by a new one with a fresh 7-day expiry; the new URL is shown

#### Scenario: Student already has account
- **WHEN** a student has already claimed their invite and has a linked user account
- **THEN** "Generate Invite Link" button is not shown; the student's registered email is shown instead

### Requirement: Teacher can delete a student
When edit mode is active, the teacher SHALL be able to delete the currently selected student. This SHALL cascade to remove the linked user account (if any), all tests, and any outstanding invite tokens.

#### Scenario: Successfully delete a student
- **WHEN** teacher clicks "Delete" and confirms
- **THEN** student, linked user, tests, and invite tokens are removed; selector updates

#### Scenario: Delete student with no linked account
- **WHEN** teacher deletes a student who never claimed their invite
- **THEN** student profile and invite token are removed; no user account to remove

### Requirement: Teacher can add and delete tests for a student
When edit mode is active, the teacher SHALL be able to add a named test and delete existing tests from the selected student's score table. The last test cannot be deleted.

#### Scenario: Add a test
- **WHEN** teacher clicks "+ Add Test" and enters a name
- **THEN** new test row appears at the bottom with a blank score; persisted to PostgreSQL

#### Scenario: Delete a test
- **WHEN** teacher clicks delete on a test row and confirms
- **THEN** test is removed from the table and database

#### Scenario: Delete last test
- **WHEN** only one test exists
- **THEN** an alert is shown; no deletion occurs

### Requirement: Teacher can enter and edit scores
When edit mode is active, score input cells SHALL be editable. Changes SHALL update the AP badge, estimated banner, and charts in real time. Changes SHALL be auto-saved to PostgreSQL after 600 ms of inactivity with a "Saving… / Saved ✓" indicator.

#### Scenario: Enter a score
- **WHEN** teacher types a number (0–100) into a score cell
- **THEN** AP badge, summary row, estimated banner, and charts update immediately

#### Scenario: Auto-save debounce
- **WHEN** teacher stops typing for 600 ms
- **THEN** PUT request fires; "Saved ✓" appears for 2 seconds on success

#### Scenario: Score cell read-only in view mode
- **WHEN** edit mode is NOT active
- **THEN** score inputs are `readonly` and cannot be typed into

### Requirement: Teacher can manage student accounts from the accounts modal
A "Manage Accounts" button in the toolbar SHALL open a modal listing all students with their registration status (pending invite / registered + Google email). For registered students, the teacher can see their Google email. For unregistered students, the teacher can generate or copy an invite link.

#### Scenario: View accounts list
- **WHEN** teacher opens "Manage Accounts"
- **THEN** a table shows each student's name, registration status, and Google email (if registered) or an invite action (if not)

#### Scenario: Copy invite link to clipboard
- **WHEN** teacher clicks "Copy Invite Link" for an unregistered student
- **THEN** the URL is written to the clipboard and a "Copied!" toast appears

### Requirement: Teacher can export and import score data as JSON
Export JSON (downloads current student's data) and Import JSON (uploads a JSON file to update scores) are available in edit mode only.

#### Scenario: Export JSON
- **WHEN** teacher clicks "Export JSON"
- **THEN** a JSON file named `ap_scores_<name>_<date>.json` is downloaded

#### Scenario: Import JSON
- **WHEN** teacher selects a valid JSON file
- **THEN** scores are updated in the table and persisted to PostgreSQL

### Requirement: Teacher can create and manage viewer links (行政/申请老师)
The teacher SHALL have a "Viewer Links" (行政/申请老师链接) entry point (e.g. toolbar button or modal tab). From there they can create a viewer link by entering a name (e.g. "行政老师", "申请老师") and selecting which students that link can see. The system SHALL return a full URL; teacher can copy it and share with the intended viewer. Teacher can list existing viewer links, copy URL again, change the set of students, or delete a link.

#### Scenario: Create viewer link with name and student selection
- **WHEN** teacher creates a viewer link with name "申请老师" and selects students A, B, C
- **THEN** a new link is saved; its URL is shown and copied to clipboard

#### Scenario: Edit viewer link students
- **WHEN** teacher edits an existing viewer link and changes the selected students
- **THEN** the link token is unchanged; only the allowed student set is updated

### Requirement: Teacher can generate and revoke student share links (给学生免注册)
For each student, the teacher SHALL be able to generate a "Share link" that allows anyone with the link to view that student's report only (no login). The link URL is shown and copied. Teacher can optionally set an expiry or regenerate the link to revoke the previous one.

#### Scenario: Generate share link for current student
- **WHEN** teacher clicks "Share link" (e.g. in toolbar or student context)
- **THEN** a share link URL for the current student is created or reused; URL is shown and copied

#### Scenario: Regenerate share link
- **WHEN** teacher regenerates a share link for a student
- **THEN** the old token is invalidated; a new URL is generated and copied
