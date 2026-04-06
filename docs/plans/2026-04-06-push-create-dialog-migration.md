# Push Create Dialog Migration Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Replace the standalone "新建推送" page with a large centered dialog launched from the push records page, and remove the dedicated route/page entry.

**Architecture:** Extract the existing push creation form logic into a reusable dialog-oriented component, mount it inside `PushRecordsView.vue`, and make the records page own open/close, success refresh, and navigation handling. Remove the standalone route and the obsolete page file after the dialog flow is working.

**Tech Stack:** Vue 3, Element Plus, Vue Router, Vite

---

### Task 1: Extract reusable push create form component

**Files:**
- Create: `E:\Desktop\upush\upush-admin\src\components\PushCreateForm.vue`
- Modify: `E:\Desktop\upush\upush-admin\src\views\PushCreateView.vue`

**Step 1: Write the failing test**
- Manual verification target: the form UI and submit logic can exist without page layout assumptions.

**Step 2: Run test — confirm it fails**
- N/A (project currently has no component test harness wired for this area).

**Step 3: Write minimal implementation**
- Move form state, payload template logic, example fill, submit logic, and result alert into `PushCreateForm.vue`.
- Emit success payload upward instead of hardcoding route navigation in the component.
- Keep API call inside the form component for minimal scope.
- Reduce `PushCreateView.vue` to a thin wrapper if needed temporarily during migration.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS

**Step 5: Commit**
`git add src/components/PushCreateForm.vue src/views/PushCreateView.vue && git commit -m "refactor: extract push create form component"`

### Task 2: Mount dialog in push records page

**Files:**
- Modify: `E:\Desktop\upush\upush-admin\src\views\PushRecordsView.vue`

**Step 1: Write the failing test**
- Manual verification target: push records page exposes a "新建推送" button and opens a large centered dialog containing the form.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: button/dialog absent before implementation.

**Step 3: Write minimal implementation**
- Add `新建推送` action button to page header.
- Add large `el-dialog` mounted in `PushRecordsView.vue`.
- Render `PushCreateForm` inside the dialog.
- On success: close dialog, refresh batch list, route to `/push-records/:batchId` when batch id exists.
- Reset dialog state on close/open as needed.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS

**Step 5: Commit**
`git add src/views/PushRecordsView.vue && git commit -m "feat: open push create form in records dialog"`

### Task 3: Remove standalone route and page

**Files:**
- Modify: `E:\Desktop\upush\upush-admin\src\router\index.js`
- Delete: `E:\Desktop\upush\upush-admin\src\views\PushCreateView.vue`
- Modify: any navigation/menu file still linking to `/push-create` if found during implementation

**Step 1: Write the failing test**
- Manual verification target: app no longer imports or routes to `PushCreateView.vue`, and push creation entry only exists via dialog.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: route import/entry still exists before removal.

**Step 3: Write minimal implementation**
- Remove `PushCreateView` import from router.
- Remove `/push-create` route record.
- Delete obsolete `PushCreateView.vue`.
- Clean up any stale navigation references.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS

**Step 5: Commit**
`git add src/router/index.js src/views/PushCreateView.vue && git commit -m "refactor: remove standalone push create page"`

### Task 4: Final verification

**Files:**
- Modify: only files touched by fixes discovered during verification

**Step 1: Write the failing test**
- Manual verification target:
  1. Push records page opens dialog
  2. Form submission still works
  3. Success path can navigate to batch detail
  4. Build passes

**Step 2: Run test — confirm it fails**
- N/A if no regression found.

**Step 3: Write minimal implementation**
- Fix any dialog sizing, event, or state-reset issues discovered in verification.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS

**Step 5: Commit**
`git add -A && git commit -m "fix: polish push create dialog flow"`
