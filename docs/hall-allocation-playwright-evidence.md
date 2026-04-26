# Hall Allocation Testing Evidence

## Component Scope

Responsible component: `Hall Allocation Module`

This module is responsible for:

- checking hall and lab availability for a selected day and time slot
- separating available halls from occupied halls
- validating whether a hall can fit the selected batch size
- allowing the coordinator to choose a suitable hall directly from the availability panel

## Automated Testing Tool

The automated testing tool used for this module is `Playwright`.

Playwright was selected because it can test the real browser-based user journey of the coordinator, including:

- opening the timetable scheduler
- viewing the hall allocation panel inside the schedule modal
- checking dynamic hall availability results
- validating capacity restrictions
- selecting a hall and submitting the schedule

## Files Used For Testing

- Test specification: [frontend/tests/hall-allocation.spec.js](..\frontend\tests\hall-allocation.spec.js)
- Playwright configuration: [frontend/playwright.config.js](..\frontend\playwright.config.js)
- Hall allocation UI under test: [frontend/src/pages/coordinator/TimetableScheduler.jsx](..\frontend\src\pages\coordinator\TimetableScheduler.jsx)
- Hall availability component under test: [frontend/src/components/common/HallAvailabilityPanel.jsx](..\frontend\src\components\common\HallAvailabilityPanel.jsx)

## User Journeys Tested

### 1. View hall availability for a selected schedule slot

The first automated test verifies that the coordinator can open the timetable scheduler, open the add schedule modal, and see:

- the hall allocation panel
- available halls / labs
- occupied halls / labs
- batch-size comparison details
- occupancy conflict details for unavailable halls

### 2. Prevent selection of a hall that is too small

The second automated test verifies that:

- halls that cannot fit the selected batch are shown as too small
- the action button for an unsuitable hall is disabled
- a suitable hall can still be selected
- the selected hall is written back into the schedule form

### 3. Submit a schedule using the selected hall

The third automated test verifies that:

- a hall selected from the hall allocation panel is used in the form submission
- the schedule submission includes the correct hall, batch, day, and time values
- the coordinator receives the success confirmation

## Execution Command

The Playwright suite for this module was executed from the `frontend` directory using:

```bash
npm run test:e2e
```

## Test Result

Execution result recorded on `2026-04-26`:

```text
Running 3 tests using 1 worker

ok 1 [msedge] Hall allocation module - shows available halls, occupied halls, and batch fit details
ok 2 [msedge] Hall allocation module - prevents choosing a hall that is too small and allows selecting a suitable hall
ok 3 [msedge] Hall allocation module - submits a schedule with the hall chosen from the availability panel

3 passed
```

## Evidence Items

### Source evidence

- Playwright test file: [frontend/tests/hall-allocation.spec.js](..\frontend\tests\hall-allocation.spec.js)
- Test configuration: [frontend/playwright.config.js](..\frontend\playwright.config.js)

### Screenshot evidence

- Overview screenshot: [docs/evidence/hall-allocation/hall-allocation-overview.png](.\evidence\hall-allocation\hall-allocation-overview.png)
- Selection screenshot: [docs/evidence/hall-allocation/hall-allocation-selection.png](.\evidence\hall-allocation\hall-allocation-selection.png)

### Report evidence

- Local Playwright HTML report: [frontend/playwright-report/index.html](..\frontend\playwright-report\index.html)

## Summary Statement

Playwright was used to automate the key user journeys of the Hall Allocation Module. The tests confirmed that the coordinator can inspect hall availability, distinguish between available and occupied halls, enforce batch-capacity suitability, select a valid hall, and submit a schedule successfully through the hall allocation workflow.
