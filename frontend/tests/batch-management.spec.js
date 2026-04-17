import { test, expect } from '@playwright/test';

test.describe('Batch Management Module', () => {

  // ✅ Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[type="email"]', 'admin@sliit.lk');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/admin');
    await page.goto('http://localhost:3000/admin/batches');
  });

  // ✅ 1. Create Batch
  test('should create a new batch successfully', async ({ page }) => {

    await page.click('button:has-text("Add Batch")');

    await page.selectOption('select[name="year"]', '2');
    await page.selectOption('select[name="semester"]', '1');
    await page.selectOption('select[name="type"]', 'WD');
    await page.selectOption('select[name="specialization"]', 'IT');
    await page.fill('input[name="mainGroup"]', '05');
    await page.fill('input[name="subGroup"]', '01');
    await page.fill('input[name="studentCount"]', '40');

    await page.click('button:has-text("Create Batch")');

    await expect(page.locator('.toast-success')).toBeVisible();
  });

  // ✅ 2. Validation Test
  test('should show validation error for invalid main group', async ({ page }) => {

    await page.click('button:has-text("Add Batch")');

    await page.fill('input[name="mainGroup"]', 'A'); // invalid

    await page.click('button:has-text("Create Batch")');

    await expect(page.locator('.form-error')).toBeVisible();
  });

  // ✅ 3. Edit Batch
  test('should edit existing batch', async ({ page }) => {

    await page.click('button[title="Edit"]'); // first edit button

    await page.fill('input[name="studentCount"]', '45');

    await page.click('button:has-text("Update Batch")');

    await expect(page.locator('.toast-success')).toBeVisible();
  });

  // ✅ 4. Delete Batch
  test('should delete batch successfully', async ({ page }) => {

    await page.click('button[title="Delete"]');
    await page.click('button:has-text("Yes, Delete")');

    await expect(page.locator('.toast-success')).toBeVisible();
  });

  // ✅ 5. Open Add Batch modal
  test('should open the Add Batch modal and show the form title', async ({ page }) => {

    await page.click('button:has-text("Add Batch")');

    await expect(page.locator('text=Create New Batch')).toBeVisible();
    await expect(page.locator('button:has-text("Create Batch")')).toBeVisible();
  });

  // ✅ 6. Auto-pad group fields
  test('should pad single-digit main and sub groups to two digits on blur', async ({ page }) => {

    await page.click('button:has-text("Add Batch")');

    await page.fill('input[name="mainGroup"]', '5');
    await page.fill('input[name="subGroup"]', '8');

    await page.click('input[name="studentCount"]');

    await expect(page.locator('input[name="mainGroup"]')).toHaveValue('05');
    await expect(page.locator('input[name="subGroup"]')).toHaveValue('08');
  });

  // ✅ 7. Batch Code Preview
  test('should display generated batch code preview while creating a batch', async ({ page }) => {

    await page.click('button:has-text("Add Batch")');

    await page.selectOption('select[name="year"]', '3');
    await page.selectOption('select[name="semester"]', '2');
    await page.selectOption('select[name="type"]', 'WE');
    await page.selectOption('select[name="specialization"]', 'CS');
    await page.fill('input[name="mainGroup"]', '05');
    await page.fill('input[name="subGroup"]', '02');

    await expect(page.locator('.bm-preview-code')).toHaveText('Y3.S2.WE.CS.05.02');
  });

});