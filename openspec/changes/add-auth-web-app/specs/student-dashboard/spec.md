## ADDED Requirements

### Requirement: Student sees only their own score report
After login, the student dashboard SHALL fetch and display only the data associated with the logged-in student's account (`GET /api/me`). No student selector, edit controls, or other students' data SHALL be accessible or visible.

#### Scenario: Student views their score report
- **WHEN** student logs in
- **THEN** their name and subject appear in a welcome banner, and the score table shows their tests

#### Scenario: Student cannot access other students' data
- **WHEN** a student token is used to call `GET /api/students`
- **THEN** server returns HTTP 403; no other student data is ever loaded on the client

### Requirement: Student dashboard is fully read-only
All score input fields SHALL be `readonly`. No edit-mode toggle, no add/delete test or student buttons, no import JSON button, and no reset scores button SHALL be shown to students.

#### Scenario: Score inputs are non-editable
- **WHEN** student views their score table
- **THEN** score cells display values but cannot be clicked or typed into

#### Scenario: Teacher-only controls are hidden
- **WHEN** student is logged in
- **THEN** the student info bar, "Unlock Edit" button, "+ Add Test", "Import JSON", "Reset Scores", and "Manage Accounts" buttons are not rendered in the DOM

### Requirement: Student can screenshot and export their report
The student toolbar SHALL show a "Screenshot" button and an "Export JSON" button, allowing the student to save their report.

#### Scenario: Student exports JSON
- **WHEN** student clicks "Export JSON"
- **THEN** a JSON file containing their test data is downloaded

#### Scenario: Student takes screenshot
- **WHEN** student clicks "Screenshot"
- **THEN** a PNG image of the report is downloaded

### Requirement: Student sees visual score analysis
The student dashboard SHALL display the same estimated banner (current average, estimated AP score, latest test score, trend), score-vs-bottomline bar chart, score trend line chart, and AP conversion table as the teacher view, populated with the student's own data.

#### Scenario: Charts reflect student data
- **WHEN** student loads their dashboard
- **THEN** bar chart and line chart display only this student's scored tests with the correct AP color coding

#### Scenario: Estimated AP score shown
- **WHEN** student has at least one scored test
- **THEN** the estimated banner displays their current average, AP score estimate, latest score, and trend arrow
