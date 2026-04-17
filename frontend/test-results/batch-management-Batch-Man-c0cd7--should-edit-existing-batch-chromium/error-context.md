# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: batch-management.spec.js >> Batch Management Module >> should edit existing batch
- Location: tests\batch-management.spec.js:48:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.toast-success')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.toast-success')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e9]: UniSlot
      - button "Collapse" [ref=e10] [cursor=pointer]:
        - img [ref=e11]
    - navigation [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Main
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /admin
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
      - generic [ref=e22]:
        - generic [ref=e23]: Management
        - link "Staff" [ref=e24] [cursor=pointer]:
          - /url: /admin/staff
          - img [ref=e25]
          - generic [ref=e30]: Staff
        - link "Batches" [ref=e31] [cursor=pointer]:
          - /url: /admin/batches
          - img [ref=e32]
          - generic [ref=e36]: Batches
        - link "Courses" [ref=e37] [cursor=pointer]:
          - /url: /admin/courses
          - img [ref=e38]
          - generic [ref=e41]: Courses
        - link "Halls" [ref=e42] [cursor=pointer]:
          - /url: /admin/halls
          - img [ref=e43]
          - generic [ref=e46]: Halls
    - generic [ref=e47]:
      - link "AU Admin User ADMIN" [ref=e48] [cursor=pointer]:
        - /url: /admin/profile
        - generic [ref=e49]: AU
        - generic [ref=e50]:
          - generic [ref=e51]: Admin User
          - generic [ref=e52]: ADMIN
      - link "Settings" [ref=e53] [cursor=pointer]:
        - /url: /admin/settings
        - img [ref=e54]
        - generic [ref=e57]: Settings
      - button "Logout" [ref=e58] [cursor=pointer]:
        - img [ref=e59]
        - generic [ref=e62]: Logout
  - generic [ref=e63]:
    - banner [ref=e64]:
      - generic [ref=e65]:
        - button "Toggle menu" [ref=e66] [cursor=pointer]:
          - img [ref=e67]
        - heading "Batch Management" [level=1] [ref=e68]
      - generic [ref=e69]:
        - button "Notifications" [ref=e70] [cursor=pointer]:
          - img [ref=e71]
        - button "AU Admin User Admin" [ref=e76] [cursor=pointer]:
          - generic [ref=e77]: AU
          - generic [ref=e78]:
            - generic [ref=e79]: Admin User
            - generic [ref=e80]: Admin
          - img [ref=e81]
    - main [ref=e83]:
      - generic [ref=e84]:
        - generic [ref=e85]:
          - generic [ref=e86]:
            - heading "Batch Management" [level=2] [ref=e87]
            - paragraph [ref=e88]: Manage student batches and groups for SLIIT Computing Faculty
          - generic [ref=e89]:
            - button "Refresh" [ref=e90] [cursor=pointer]:
              - img [ref=e92]
              - generic [ref=e96]: Refresh
            - button "Add Batch" [ref=e97] [cursor=pointer]:
              - img [ref=e99]
              - generic [ref=e100]: Add Batch
        - generic [ref=e101]:
          - generic [ref=e102]:
            - img [ref=e104]
            - generic [ref=e109]:
              - generic [ref=e110]: "7"
              - generic [ref=e111]: Total Batches
          - generic [ref=e112]:
            - img [ref=e114]
            - generic [ref=e116]:
              - generic [ref=e117]: "7"
              - generic [ref=e118]: Weekday
          - generic [ref=e119]:
            - img [ref=e121]
            - generic [ref=e124]:
              - generic [ref=e125]: "0"
              - generic [ref=e126]: Weekend
          - generic [ref=e127]:
            - img [ref=e129]
            - generic [ref=e134]:
              - generic [ref=e135]: "235"
              - generic [ref=e136]: Total Students
        - generic [ref=e137]:
          - generic [ref=e138]:
            - img [ref=e139]
            - text: Filter Batches
          - generic [ref=e141]:
            - generic [ref=e142]:
              - generic [ref=e143]: Year
              - combobox [ref=e144] [cursor=pointer]:
                - option "All Years" [selected]
                - option "Year 1"
                - option "Year 2"
                - option "Year 3"
                - option "Year 4"
            - generic [ref=e145]:
              - generic [ref=e146]: Semester
              - combobox [ref=e147] [cursor=pointer]:
                - option "All Semesters" [selected]
                - option "Semester 1"
                - option "Semester 2"
            - generic [ref=e148]:
              - generic [ref=e149]: Type
              - combobox [ref=e150] [cursor=pointer]:
                - option "All Types" [selected]
                - option "Weekday"
                - option "Weekend"
            - generic [ref=e151]:
              - generic [ref=e152]: Specialization
              - combobox [ref=e153] [cursor=pointer]:
                - option "All Specializations" [selected]
                - option "Information Technology"
                - option "Software Engineering"
                - option "Data Science"
                - option "Cyber Security"
                - option "Computer Science"
                - option "Computer Systems Engineering"
                - option "Information Systems Engineering"
                - option "Computer Science & Network Engineering"
                - option "Interactive Media"
            - button "Clear All" [ref=e154] [cursor=pointer]
        - generic [ref=e155]:
          - generic [ref=e156]:
            - heading "All Batches" [level=3] [ref=e157]
            - generic [ref=e158]: 7 batches
          - table [ref=e161]:
            - rowgroup [ref=e162]:
              - row "Batch Code Year Semester Type Specialization Group Students Actions" [ref=e163]:
                - columnheader "Batch Code" [ref=e164]:
                  - generic [ref=e166]: Batch Code
                - columnheader "Year" [ref=e167]:
                  - generic [ref=e169]: Year
                - columnheader "Semester" [ref=e170]:
                  - generic [ref=e172]: Semester
                - columnheader "Type" [ref=e173]:
                  - generic [ref=e175]: Type
                - columnheader "Specialization" [ref=e176]:
                  - generic [ref=e178]: Specialization
                - columnheader "Group" [ref=e179]:
                  - generic [ref=e181]: Group
                - columnheader "Students" [ref=e182]:
                  - generic [ref=e184]: Students
                - columnheader "Actions" [ref=e185]:
                  - generic [ref=e187]: Actions
            - rowgroup [ref=e188]:
              - row "Y2.S1.WD.IT.01.01 Y2 S1 Weekday IT 01.01 45" [ref=e189]:
                - cell "Y2.S1.WD.IT.01.01" [ref=e190]:
                  - generic [ref=e191]: Y2.S1.WD.IT.01.01
                - cell "Y2" [ref=e192]:
                  - generic [ref=e193]: Y2
                - cell "S1" [ref=e194]:
                  - generic [ref=e195]: S1
                - cell "Weekday" [ref=e196]:
                  - generic [ref=e197]: Weekday
                - cell "IT" [ref=e198]:
                  - generic [ref=e199]: IT
                - cell "01.01" [ref=e200]:
                  - generic [ref=e201]: "01.01"
                - cell "45" [ref=e202]:
                  - generic [ref=e203]:
                    - img [ref=e204]
                    - text: "45"
                - cell [ref=e209]:
                  - generic [ref=e210]:
                    - button "Edit" [ref=e211] [cursor=pointer]:
                      - img [ref=e212]
                    - button "Delete" [ref=e214] [cursor=pointer]:
                      - img [ref=e215]
              - row "Y2.S1.WD.IT.05.01 Y2 S1 Weekday IT 05.01 40" [ref=e217]:
                - cell "Y2.S1.WD.IT.05.01" [ref=e218]:
                  - generic [ref=e219]: Y2.S1.WD.IT.05.01
                - cell "Y2" [ref=e220]:
                  - generic [ref=e221]: Y2
                - cell "S1" [ref=e222]:
                  - generic [ref=e223]: S1
                - cell "Weekday" [ref=e224]:
                  - generic [ref=e225]: Weekday
                - cell "IT" [ref=e226]:
                  - generic [ref=e227]: IT
                - cell "05.01" [ref=e228]:
                  - generic [ref=e229]: "05.01"
                - cell "40" [ref=e230]:
                  - generic [ref=e231]:
                    - img [ref=e232]
                    - text: "40"
                - cell [ref=e237]:
                  - generic [ref=e238]:
                    - button "Edit" [ref=e239] [cursor=pointer]:
                      - img [ref=e240]
                    - button "Delete" [ref=e242] [cursor=pointer]:
                      - img [ref=e243]
              - row "Y2.S2.WD.IT.01.03 Y2 S2 Weekday IT 01.03 30" [ref=e245]:
                - cell "Y2.S2.WD.IT.01.03" [ref=e246]:
                  - generic [ref=e247]: Y2.S2.WD.IT.01.03
                - cell "Y2" [ref=e248]:
                  - generic [ref=e249]: Y2
                - cell "S2" [ref=e250]:
                  - generic [ref=e251]: S2
                - cell "Weekday" [ref=e252]:
                  - generic [ref=e253]: Weekday
                - cell "IT" [ref=e254]:
                  - generic [ref=e255]: IT
                - cell "01.03" [ref=e256]:
                  - generic [ref=e257]: "01.03"
                - cell "30" [ref=e258]:
                  - generic [ref=e259]:
                    - img [ref=e260]
                    - text: "30"
                - cell [ref=e265]:
                  - generic [ref=e266]:
                    - button "Edit" [ref=e267] [cursor=pointer]:
                      - img [ref=e268]
                    - button "Delete" [ref=e270] [cursor=pointer]:
                      - img [ref=e271]
              - row "Y3.S1.WD.IT.03.01 Y3 S1 Weekday IT 03.01 30" [ref=e273]:
                - cell "Y3.S1.WD.IT.03.01" [ref=e274]:
                  - generic [ref=e275]: Y3.S1.WD.IT.03.01
                - cell "Y3" [ref=e276]:
                  - generic [ref=e277]: Y3
                - cell "S1" [ref=e278]:
                  - generic [ref=e279]: S1
                - cell "Weekday" [ref=e280]:
                  - generic [ref=e281]: Weekday
                - cell "IT" [ref=e282]:
                  - generic [ref=e283]: IT
                - cell "03.01" [ref=e284]:
                  - generic [ref=e285]: "03.01"
                - cell "30" [ref=e286]:
                  - generic [ref=e287]:
                    - img [ref=e288]
                    - text: "30"
                - cell [ref=e293]:
                  - generic [ref=e294]:
                    - button "Edit" [ref=e295] [cursor=pointer]:
                      - img [ref=e296]
                    - button "Delete" [ref=e298] [cursor=pointer]:
                      - img [ref=e299]
              - row "Y3.S2.WD.IT.02.02 Y3 S2 Weekday IT 02.02 30" [ref=e301]:
                - cell "Y3.S2.WD.IT.02.02" [ref=e302]:
                  - generic [ref=e303]: Y3.S2.WD.IT.02.02
                - cell "Y3" [ref=e304]:
                  - generic [ref=e305]: Y3
                - cell "S2" [ref=e306]:
                  - generic [ref=e307]: S2
                - cell "Weekday" [ref=e308]:
                  - generic [ref=e309]: Weekday
                - cell "IT" [ref=e310]:
                  - generic [ref=e311]: IT
                - cell "02.02" [ref=e312]:
                  - generic [ref=e313]: "02.02"
                - cell "30" [ref=e314]:
                  - generic [ref=e315]:
                    - img [ref=e316]
                    - text: "30"
                - cell [ref=e321]:
                  - generic [ref=e322]:
                    - button "Edit" [ref=e323] [cursor=pointer]:
                      - img [ref=e324]
                    - button "Delete" [ref=e326] [cursor=pointer]:
                      - img [ref=e327]
              - row "Y4.S1.WD.IT.01.01 Y4 S1 Weekday IT 01.01 30" [ref=e329]:
                - cell "Y4.S1.WD.IT.01.01" [ref=e330]:
                  - generic [ref=e331]: Y4.S1.WD.IT.01.01
                - cell "Y4" [ref=e332]:
                  - generic [ref=e333]: Y4
                - cell "S1" [ref=e334]:
                  - generic [ref=e335]: S1
                - cell "Weekday" [ref=e336]:
                  - generic [ref=e337]: Weekday
                - cell "IT" [ref=e338]:
                  - generic [ref=e339]: IT
                - cell "01.01" [ref=e340]:
                  - generic [ref=e341]: "01.01"
                - cell "30" [ref=e342]:
                  - generic [ref=e343]:
                    - img [ref=e344]
                    - text: "30"
                - cell [ref=e349]:
                  - generic [ref=e350]:
                    - button "Edit" [ref=e351] [cursor=pointer]:
                      - img [ref=e352]
                    - button "Delete" [ref=e354] [cursor=pointer]:
                      - img [ref=e355]
              - row "Y4.S2.WD.IT.03.03 Y4 S2 Weekday IT 03.03 30" [ref=e357]:
                - cell "Y4.S2.WD.IT.03.03" [ref=e358]:
                  - generic [ref=e359]: Y4.S2.WD.IT.03.03
                - cell "Y4" [ref=e360]:
                  - generic [ref=e361]: Y4
                - cell "S2" [ref=e362]:
                  - generic [ref=e363]: S2
                - cell "Weekday" [ref=e364]:
                  - generic [ref=e365]: Weekday
                - cell "IT" [ref=e366]:
                  - generic [ref=e367]: IT
                - cell "03.03" [ref=e368]:
                  - generic [ref=e369]: "03.03"
                - cell "30" [ref=e370]:
                  - generic [ref=e371]:
                    - img [ref=e372]
                    - text: "30"
                - cell [ref=e377]:
                  - generic [ref=e378]:
                    - button "Edit" [ref=e379] [cursor=pointer]:
                      - img [ref=e380]
                    - button "Delete" [ref=e382] [cursor=pointer]:
                      - img [ref=e383]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Batch Management Module', () => {
  4   | 
  5   |   // ✅ Login before each test
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await page.goto('http://localhost:3000/login');
  8   | 
  9   |     await page.fill('input[type="email"]', 'admin@sliit.lk');
  10  |     await page.fill('input[type="password"]', 'admin123');
  11  |     await page.click('button:has-text("Sign In")');
  12  | 
  13  |     await page.waitForURL('**/admin');
  14  |     await page.goto('http://localhost:3000/admin/batches');
  15  |   });
  16  | 
  17  |   // ✅ 1. Create Batch
  18  |   test('should create a new batch successfully', async ({ page }) => {
  19  | 
  20  |     await page.click('button:has-text("Add Batch")');
  21  | 
  22  |     await page.selectOption('select[name="year"]', '2');
  23  |     await page.selectOption('select[name="semester"]', '1');
  24  |     await page.selectOption('select[name="type"]', 'WD');
  25  |     await page.selectOption('select[name="specialization"]', 'IT');
  26  |     await page.fill('input[name="mainGroup"]', '05');
  27  |     await page.fill('input[name="subGroup"]', '01');
  28  |     await page.fill('input[name="studentCount"]', '40');
  29  | 
  30  |     await page.click('button:has-text("Create Batch")');
  31  | 
  32  |     await expect(page.locator('.toast-success')).toBeVisible();
  33  |   });
  34  | 
  35  |   // ✅ 2. Validation Test
  36  |   test('should show validation error for invalid main group', async ({ page }) => {
  37  | 
  38  |     await page.click('button:has-text("Add Batch")');
  39  | 
  40  |     await page.fill('input[name="mainGroup"]', 'A'); // invalid
  41  | 
  42  |     await page.click('button:has-text("Create Batch")');
  43  | 
  44  |     await expect(page.locator('.form-error')).toBeVisible();
  45  |   });
  46  | 
  47  |   // ✅ 3. Edit Batch
  48  |   test('should edit existing batch', async ({ page }) => {
  49  | 
  50  |     await page.click('button[title="Edit"]'); // first edit button
  51  | 
  52  |     await page.fill('input[name="studentCount"]', '45');
  53  | 
  54  |     await page.click('button:has-text("Update Batch")');
  55  | 
> 56  |     await expect(page.locator('.toast-success')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  57  |   });
  58  | 
  59  |   // ✅ 4. Delete Batch
  60  |   test('should delete batch successfully', async ({ page }) => {
  61  | 
  62  |     await page.click('button[title="Delete"]');
  63  |     await page.click('button:has-text("Yes, Delete")');
  64  | 
  65  |     await expect(page.locator('.toast-success')).toBeVisible();
  66  |   });
  67  | 
  68  |   // ✅ 5. Open Add Batch modal
  69  |   test('should open the Add Batch modal and show the form title', async ({ page }) => {
  70  | 
  71  |     await page.click('button:has-text("Add Batch")');
  72  | 
  73  |     await expect(page.locator('text=Create New Batch')).toBeVisible();
  74  |     await expect(page.locator('button:has-text("Create Batch")')).toBeVisible();
  75  |   });
  76  | 
  77  |   // ✅ 6. Auto-pad group fields
  78  |   test('should pad single-digit main and sub groups to two digits on blur', async ({ page }) => {
  79  | 
  80  |     await page.click('button:has-text("Add Batch")');
  81  | 
  82  |     await page.fill('input[name="mainGroup"]', '5');
  83  |     await page.fill('input[name="subGroup"]', '8');
  84  | 
  85  |     await page.click('input[name="studentCount"]');
  86  | 
  87  |     await expect(page.locator('input[name="mainGroup"]')).toHaveValue('05');
  88  |     await expect(page.locator('input[name="subGroup"]')).toHaveValue('08');
  89  |   });
  90  | 
  91  |   // ✅ 7. Batch Code Preview
  92  |   test('should display generated batch code preview while creating a batch', async ({ page }) => {
  93  | 
  94  |     await page.click('button:has-text("Add Batch")');
  95  | 
  96  |     await page.selectOption('select[name="year"]', '3');
  97  |     await page.selectOption('select[name="semester"]', '2');
  98  |     await page.selectOption('select[name="type"]', 'WE');
  99  |     await page.selectOption('select[name="specialization"]', 'CS');
  100 |     await page.fill('input[name="mainGroup"]', '05');
  101 |     await page.fill('input[name="subGroup"]', '02');
  102 | 
  103 |     await expect(page.locator('.bm-preview-code')).toHaveText('Y3.S2.WE.CS.05.02');
  104 |   });
  105 | 
  106 | });
```