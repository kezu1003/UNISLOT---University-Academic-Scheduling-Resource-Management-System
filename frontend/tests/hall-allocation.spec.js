const { test, expect } = require('@playwright/test');

const coordinatorUser = {
  _id: 'user-coordinator-1',
  name: 'Coordinator Demo',
  email: 'coord@sliit.lk',
  role: 'coordinator'
};

const courses = [
  {
    _id: 'course-1',
    courseCode: 'IT2010',
    courseName: 'Software Engineering'
  }
];

const batches = [
  {
    _id: 'batch-1',
    batchCode: 'Y2.S1.WD.SE.01',
    studentCount: 120
  }
];

const halls = [
  {
    _id: 'hall-1',
    hallCode: 'LH401',
    hallName: 'Main Lecture Hall',
    capacity: 150,
    location: 'Block A',
    type: 'Lecture Hall'
  },
  {
    _id: 'hall-2',
    hallCode: 'LH205',
    hallName: 'Compact Lecture Hall',
    capacity: 80,
    location: 'Block B',
    type: 'Lecture Hall'
  },
  {
    _id: 'hall-3',
    hallCode: 'LAB301',
    hallName: 'Network Lab',
    capacity: 60,
    location: 'Block C',
    type: 'Lab'
  }
];

const staff = [
  {
    _id: 'staff-1',
    name: 'Dr. N. Perera',
    location: 'Block A'
  }
];

const emptyTimetable = [];

function availabilityPayload({ includeBatch = true } = {}) {
  return {
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    requestedType: 'all',
    requestedLocation: 'all',
    batch: includeBatch
      ? {
          _id: 'batch-1',
          batchCode: 'Y2.S1.WD.SE.01',
          studentCount: 120
        }
      : null,
    summary: {
      total: 3,
      available: 2,
      unavailable: 1,
      suitableForBatch: includeBatch ? 1 : 3
    },
    halls: [
      {
        _id: 'hall-1',
        hallCode: 'LH401',
        hallName: 'Main Lecture Hall',
        capacity: 150,
        location: 'Block A',
        type: 'Lecture Hall',
        isAvailable: true,
        canFitBatch: true,
        capacityShortfall: 0,
        conflictingEntries: []
      },
      {
        _id: 'hall-2',
        hallCode: 'LH205',
        hallName: 'Compact Lecture Hall',
        capacity: 80,
        location: 'Block B',
        type: 'Lecture Hall',
        isAvailable: true,
        canFitBatch: false,
        capacityShortfall: 40,
        conflictingEntries: []
      },
      {
        _id: 'hall-3',
        hallCode: 'LAB301',
        hallName: 'Network Lab',
        capacity: 60,
        location: 'Block C',
        type: 'Lab',
        isAvailable: false,
        canFitBatch: false,
        capacityShortfall: 60,
        conflictingEntries: [
          {
            id: 'entry-1',
            courseCode: 'IT3050',
            batchCode: 'Y3.S1.WD.CS.01',
            startTime: '08:00',
            endTime: '10:00'
          }
        ]
      }
    ]
  };
}

async function mockSchedulerApis(page, options = {}) {
  const {
    timetable = emptyTimetable,
    availability = availabilityPayload(),
    createTimetableHandler
  } = options;

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: coordinatorUser
      })
    });
  });

  await page.route('**/api/admin/courses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: courses
      })
    });
  });

  await page.route('**/api/admin/batches**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: batches
      })
    });
  });

  await page.route('**/api/admin/halls**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: halls
      })
    });
  });

  await page.route('**/api/admin/staff**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: staff
      })
    });
  });

  await page.route('**/api/coordinator/timetable?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: timetable,
        total: timetable.length
      })
    });
  });

  await page.route('**/api/coordinator/halls/availability?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: availability
      })
    });
  });

  await page.route('**/api/coordinator/timetable', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    if (createTimetableHandler) {
      await createTimetableHandler(route);
      return;
    }

    const requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Timetable entry created successfully',
        data: {
          _id: 'new-entry-1',
          ...requestBody
        }
      })
    });
  });
}

async function openHallAllocationModal(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'playwright-token');
  });

  await page.goto('/coordinator/timetable');
  await expect(page.getByRole('heading', { name: 'Timetable Scheduler' })).toBeVisible();

  await page.getByRole('button', { name: /add schedule/i }).click();
  await expect(page.getByRole('heading', { name: /add new schedule/i })).toBeVisible();
}

test.describe('Hall allocation module', () => {
  test('shows available halls, occupied halls, and batch fit details', async ({ page }, testInfo) => {
    await mockSchedulerApis(page);
    await openHallAllocationModal(page);

    await page.locator('#course').selectOption('course-1');
    await page.locator('#batch').selectOption('batch-1');
    await page.locator('#instructor').selectOption('staff-1');

    await expect(page.getByText('Hall / Lab Availability')).toBeVisible();
    await expect(page.getByText('Comparing hall capacity against 120 students.')).toBeVisible();
    await expect(page.getByText('Available Halls / Labs')).toBeVisible();
    await expect(page.getByText('Occupied Halls / Labs')).toBeVisible();
    await expect(page.getByText('Too small by 40 seats for Y2.S1.WD.SE.01')).toBeVisible();
    await expect(page.getByText('IT3050 | Y3.S1.WD.CS.01 | 08:00-10:00')).toBeVisible();

    const panelShot = testInfo.outputPath('hall-allocation-overview.png');
    await page.screenshot({ path: panelShot, fullPage: true });
    await testInfo.attach('hall-allocation-overview', {
      path: panelShot,
      contentType: 'image/png'
    });
  });

  test('prevents choosing a hall that is too small and allows selecting a suitable hall', async ({ page }, testInfo) => {
    await mockSchedulerApis(page);
    await openHallAllocationModal(page);

    await page.locator('#batch').selectOption('batch-1');

    const compactHallCard = page.locator('.availability-item').filter({
      has: page.getByText('LH205')
    });
    await expect(compactHallCard.getByRole('button', { name: 'Use Hall' })).toBeDisabled();

    const mainHallCard = page.locator('.availability-item').filter({
      has: page.getByText('LH401')
    });
    await mainHallCard.getByRole('button', { name: 'Use Hall' }).click();

    await expect(page.locator('#hall')).toHaveValue('hall-1');
    await expect(page.getByText('Capacity check passed: LH401 has 150 seats for 120 students')).toBeVisible();

    const selectionShot = testInfo.outputPath('hall-allocation-selection.png');
    await page.screenshot({ path: selectionShot, fullPage: true });
    await testInfo.attach('hall-allocation-selection', {
      path: selectionShot,
      contentType: 'image/png'
    });
  });

  test('submits a schedule with the hall chosen from the availability panel', async ({ page }) => {
    let submittedPayload = null;

    await mockSchedulerApis(page, {
      createTimetableHandler: async (route) => {
        submittedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Timetable entry created successfully',
            data: {
              _id: 'entry-created-1',
              ...submittedPayload
            }
          })
        });
      }
    });

    await openHallAllocationModal(page);

    await page.locator('#course').selectOption('course-1');
    await page.locator('#batch').selectOption('batch-1');
    await page.locator('#instructor').selectOption('staff-1');
    await page.locator('.availability-item').filter({
      has: page.getByText('LH401')
    }).getByRole('button', { name: 'Use Hall' }).click();

    await page.getByRole('button', { name: /create schedule/i }).click();

    await expect(page.getByText('Schedule created successfully!')).toBeVisible();
    expect(submittedPayload).not.toBeNull();
    expect(submittedPayload.hall).toBe('hall-1');
    expect(submittedPayload.batch).toBe('batch-1');
    expect(submittedPayload.day).toBe('Monday');
    expect(submittedPayload.startTime).toBe('08:00');
    expect(submittedPayload.endTime).toBe('10:00');
  });
});
