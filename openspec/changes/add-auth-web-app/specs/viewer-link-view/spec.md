## ADDED Requirements

### Requirement: Holder of a viewer link sees a read-only list of assigned students
When a user opens a viewer link URL (e.g. `/view/link/<token>`), the frontend SHALL call a public API (no auth) to load the link metadata and the list of students assigned to that link. The page SHALL display a student selector and the same report UI (score table, charts, estimated banner, conversion table) in read-only mode. No login or registration is required.

#### Scenario: Open viewer link with multiple students
- **WHEN** user opens a valid viewer link that has 3 students assigned
- **THEN** they see a dropdown to switch between those 3 students and the report for the selected one; all controls are read-only

#### Scenario: Open viewer link with one student
- **WHEN** user opens a valid viewer link with only one student assigned
- **THEN** they see that student's report only; selector may be hidden or show single option

#### Scenario: Invalid or expired viewer token
- **WHEN** user opens a URL with an unknown or deleted viewer token
- **THEN** API returns 404; frontend shows "Invalid or expired link"

### Requirement: Viewer link page has no edit controls
The viewer link view SHALL NOT show: edit-mode toggle, add/delete student, add/delete test, score input editing, import JSON, reset scores, manage accounts, or generate invite. Only screenshot and export JSON (for the currently viewed report) may be offered.

#### Scenario: No edit controls visible
- **WHEN** page is loaded via viewer link
- **THEN** toolbar shows only optional screenshot/export; score cells are not editable

### Requirement: Teacher can create and manage viewer links
From the teacher dashboard, the teacher SHALL be able to open a "Viewer Links" (or "行政/申请老师链接") section/modal where they can create a new viewer link by entering a name (e.g. "行政老师", "申请老师") and selecting which students that link can see. After creation, the full URL is shown and can be copied. Teacher can list existing viewer links and delete or edit the student set for each.

#### Scenario: Create viewer link
- **WHEN** teacher enters name "行政老师", selects students A and B, and submits
- **THEN** a new viewer link is created; URL is displayed and copied to clipboard; link appears in the list

#### Scenario: Copy viewer link URL
- **WHEN** teacher clicks "Copy link" for an existing viewer link
- **THEN** the URL is copied to clipboard and a "Copied!" toast is shown

#### Scenario: Update students for a viewer link
- **WHEN** teacher edits an existing viewer link and changes the selected students
- **THEN** the link token stays the same; only the set of students is updated

#### Scenario: Delete viewer link
- **WHEN** teacher deletes a viewer link
- **THEN** the link is removed; the URL will no longer work
