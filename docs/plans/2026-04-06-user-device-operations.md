# User & Device Operations Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Add a first practical set of user operations and device operations to the admin backend, with clear action surfaces in user/device detail views and safe server-backed execution paths.

**Architecture:** Reuse the current `UsersView.vue` and `DevicesView.vue` detail drawers as the main action entry surfaces, then add matching backend admin endpoints in `upushServer` for each operation. Keep the first batch intentionally small and operationally useful: user status change, user device inspection / jump-off, single-device removal / unbind, and safe confirmation UX for destructive actions.

**Tech Stack:** Vue 3, Element Plus, Vue Router, Axios, Node.js, Express-style routes, MongoDB / uniCloud-backed admin APIs, Vite

---

### Task 1: Define first-batch operation scope and UX contract

**Files:**
- Create: `E:\Desktop\upush\upush-admin\docs\plans\2026-04-06-user-device-operations-design-notes.md`
- Modify: `E:\Desktop\upush\upush-admin\docs\plans\2026-04-06-user-device-operations.md`

**Step 1: Write the failing test**
- Manual verification target: the plan clearly limits v1 scope to a safe, useful subset instead of mixing every possible operation.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: no formal scope doc exists yet, leaving action semantics ambiguous.

**Step 3: Write minimal implementation**
- Document and lock the v1 operation set:
  1. User: disable / enable account status
  2. User: jump to filtered device list
  3. Device: remove / unbind a single device record
  4. Device: keep current detail → user jump path
- Record which actions are reversible vs destructive.
- Define required confirmation UX:
  - status change: confirm dialog
  - device removal: stronger confirm copy
- Define post-action refresh behavior for list + detail.

**Step 4: Run test — confirm it passes**
- Manual review: v1 scope is explicit, small, and implementable.

**Step 5: Commit**
`git add docs/plans/2026-04-06-user-device-operations-design-notes.md docs/plans/2026-04-06-user-device-operations.md && git commit -m "docs: define user and device operations scope"`

### Task 2: Add backend admin endpoint for updating user status

**Files:**
- Modify: `E:\Desktop\upush\upushServer\routes\admin\index.js`
- Modify: any shared admin validation / helper files if needed under `E:\Desktop\upush\upushServer\utils\`

**Step 1: Write the failing test**
- Manual verification target: calling the new endpoint with a valid user id and status updates the record and returns the refreshed user summary.

**Step 2: Run test — confirm it fails**
- Command: hit non-existent route before implementation (example)
- Expected: 404 / unsupported route

**Step 3: Write minimal implementation**
- Add admin route such as `POST /admin/users/:id/status`.
- Accept a small status payload only (`0` or `1` for current scope).
- Validate id and status strictly.
- Update the target user record.
- Return normalized user detail data or concise success payload.
- Add error handling + admin log line for auditability.

**Step 4: Run test — confirm it passes**
- Manual/API verification command (example): invoke the new endpoint and confirm the status is updated.
- Expected: 200 success, data reflects new status.

**Step 5: Commit**
`git add routes/admin/index.js utils && git commit -m "feat: add admin user status update api"`

### Task 3: Add backend admin endpoint for device removal / unbind

**Files:**
- Modify: `E:\Desktop\upush\upushServer\routes\admin\index.js`
- Modify: any shared admin helper files if needed under `E:\Desktop\upush\upushServer\utils\`

**Step 1: Write the failing test**
- Manual verification target: removing a device through admin endpoint deletes or unbinds the target device record safely and reports success.

**Step 2: Run test — confirm it fails**
- Command: hit non-existent route before implementation
- Expected: 404 / unsupported route

**Step 3: Write minimal implementation**
- Add admin route such as `POST /admin/devices/:id/remove` or `DELETE /admin/devices/:id`.
- Validate target device existence first.
- Perform the chosen v1 behavior consistently:
  - either hard delete
  - or logical unbind/delete according to current data model
- Return concise success response with removed target id.
- Add audit log line containing device id and related user id if available.

**Step 4: Run test — confirm it passes**
- Manual/API verification command: remove a known test device and confirm it no longer appears in device list results.
- Expected: 200 success and follow-up list/detail confirms removal.

**Step 5: Commit**
`git add routes/admin/index.js utils && git commit -m "feat: add admin device removal api"`

### Task 4: Add frontend API wrappers for user and device operations

**Files:**
- Modify: `E:\Desktop\upush\upush-admin\src\api\index.js`

**Step 1: Write the failing test**
- Manual verification target: frontend has dedicated API helpers instead of ad-hoc inline axios calls in views.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: operation helpers do not exist before implementation.

**Step 3: Write minimal implementation**
- Add helpers such as:
  - `updateUserStatus(id, payload)`
  - `removeDevice(id)`
- Keep signatures simple and aligned with backend endpoints.
- Preserve existing request instance usage and error semantics.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS

**Step 5: Commit**
`git add src/api/index.js && git commit -m "feat: add admin user and device operation apis"`

### Task 5: Add user operations area to user detail drawer

**Files:**
- Modify: `E:\Desktop\upush\upush-admin\src\views\UsersView.vue`

**Step 1: Write the failing test**
- Manual verification target: user detail drawer exposes a visible operation area for enable/disable account state and reflects result without manual page refresh.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: no direct user action controls exist yet.

**Step 3: Write minimal implementation**
- Add an “操作” section in the user detail drawer.
- Provide actions based on current status:
  - if status `0` → show disable action
  - if status not `0` → show enable action
- Use confirmation dialog before mutation.
- On success:
  - refresh detail data
  - refresh current user list page
  - keep current detail open if possible
  - preserve row highlight / route state
- Surface success and failure feedback with `ElMessage`.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS
Manual verification: status action updates both detail tag and list row state.

**Step 5: Commit**
`git add src/views/UsersView.vue && git commit -m "feat: add user status actions in detail drawer"`

### Task 6: Add device operations area to device detail drawer

**Files:**
- Modify: `E:\Desktop\upush\upush-admin\src\views\DevicesView.vue`

**Step 1: Write the failing test**
- Manual verification target: device detail drawer exposes a destructive but confirmed remove/unbind action and UI recovers cleanly after success.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: no direct device action controls exist yet.

**Step 3: Write minimal implementation**
- Add an “操作” section in the device detail drawer.
- Add remove / unbind action button with stronger confirm copy.
- On success:
  - close detail drawer if the current device was removed
  - refresh current device list
  - clear `detail` route query when appropriate
  - preserve `userId` filter if current list is user-scoped
- Surface success and failure feedback with `ElMessage`.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS
Manual verification: removed device disappears from list and detail state resets correctly.

**Step 5: Commit**
`git add src/views/DevicesView.vue && git commit -m "feat: add device remove action in detail drawer"`

### Task 7: Add operation-state polish and safety feedback

**Files:**
- Modify: `E:\Desktop\upush\upush-admin\src\views\UsersView.vue`
- Modify: `E:\Desktop\upush\upush-admin\src\views\DevicesView.vue`
- Modify: `E:\Desktop\upush\upush-admin\src\styles\admin-ui.css` or local scoped styles if needed

**Step 1: Write the failing test**
- Manual verification target: while an operation is running, action buttons are disabled/loading and destructive actions are visually distinct.

**Step 2: Run test — confirm it fails**
- N/A manual fail state: action buttons have no pending-state protection before implementation.

**Step 3: Write minimal implementation**
- Add local loading state for each operation area.
- Disable duplicate submissions during in-flight mutation.
- Style destructive actions with clearer danger semantics.
- Improve confirmation copy to mention consequences plainly.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS
Manual verification: repeated rapid clicks do not trigger duplicate requests.

**Step 5: Commit**
`git add src/views/UsersView.vue src/views/DevicesView.vue src/styles/admin-ui.css && git commit -m "fix: polish admin operation safety states"`

### Task 8: Final end-to-end verification

**Files:**
- Modify: only files touched by fixes discovered during verification

**Step 1: Write the failing test**
- Manual verification target:
  1. Open user detail from list
  2. Disable / enable user
  3. See list and detail update together
  4. Jump to user devices
  5. Remove a device from device detail
  6. Preserve filtered context and route state correctly

**Step 2: Run test — confirm it fails**
- N/A if no regression found.

**Step 3: Write minimal implementation**
- Fix any state-sync, refresh, route, or confirmation issues found during verification.

**Step 4: Run test — confirm it passes**
Command: `npm run build`
Expected: PASS
Additional verification: manually exercise the full user → device → remove flow.

**Step 5: Commit**
`git add -A && git commit -m "fix: finalize user and device admin operations flow"`
