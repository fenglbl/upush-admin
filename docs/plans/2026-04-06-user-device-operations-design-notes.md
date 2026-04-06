# User & Device Operations — V1 Design Notes

## Scope
This note locks the first practical batch of admin operations for the current `upush-admin` + `upushServer` stack.

V1 includes only four operation capabilities:

1. **User enable / disable**
2. **User detail → jump to filtered device list**
3. **Device detail → remove / unbind a single device**
4. **Device detail → jump to related user detail**

Anything outside this list is explicitly deferred.

---

## Included Operations

### 1. User status change
**Surface:** `UsersView.vue` user detail drawer

**Actions:**
- If user status is `0`: show **禁用用户**
- If user status is not `0`: show **启用用户**

**Purpose:**
Give admins a minimal account-state control without introducing broader account editing flows.

**Semantics:**
- This is **reversible**
- It changes account availability/status only
- It must not silently mutate unrelated profile fields

---

### 2. User → device context jump
**Surface:** `UsersView.vue` user detail drawer

**Action:**
- **查看设备**

**Purpose:**
Allow operators to move from a user-centric view to that user's device inventory without manually re-entering user id filters.

**Semantics:**
- This is **non-destructive**
- It should navigate to `/devices?userId=<userId>`
- The target page must clearly indicate that the current device list is filtered

---

### 3. Device remove / unbind
**Surface:** `DevicesView.vue` device detail drawer

**Action:**
- **移除设备** or **解绑设备** (final wording may depend on backend semantics)

**Purpose:**
Give admins a direct device cleanup action for invalid, stale, or unwanted device records.

**Semantics:**
- This is **destructive**
- V1 should choose one consistent backend behavior and keep frontend wording aligned:
  - either remove the record entirely
  - or unbind the device record in a way that makes it disappear from the active admin list
- The action must not be disguised as reversible

---

### 4. Device → user context jump
**Surface:** `DevicesView.vue` device detail drawer

**Action:**
- **查看用户**

**Purpose:**
Let operators move from a suspicious/problem device directly back to the owning user context.

**Semantics:**
- This is **non-destructive**
- It should navigate to `/users?detail=<userId>`

---

## Deferred Operations (Not in V1)

The following are intentionally **not** included in this batch:

- Reset password
- Force logout / token invalidation
- Batch user status operations
- Bulk device removal
- Profile editing (nickname/email)
- Manual device reassignment
- Tagging / notes / operator comments
- Push-message operations from user/device detail
- User-wide device wipe / clear all devices

These can be planned after the first action surfaces are stable.

---

## Confirmation Rules

### User status change
Use a standard confirmation dialog.

**Enable example:**
- Title: `确认启用该用户？`
- Message: `启用后，该账号会恢复到可用状态。`

**Disable example:**
- Title: `确认禁用该用户？`
- Message: `禁用后，该账号会变为不可用状态，但用户数据不会被删除。`

### Device remove / unbind
Use a stronger, more explicit confirm dialog.

**Example:**
- Title: `确认移除这台设备？`
- Message: `移除后，该设备将从当前设备列表中消失。此操作用于清理失效或不再使用的设备记录。`

The destructive action should use danger styling.

---

## Post-Action Refresh Contract

### After user status change succeeds
Frontend should:
1. Refresh current user detail
2. Refresh current user list page
3. Keep the current detail drawer open if possible
4. Preserve the current `detail` route query
5. Preserve current filters / page when reasonable

### After device removal succeeds
Frontend should:
1. Refresh current device list page
2. Close the current device detail drawer if the removed device is the open one
3. Clear the `detail` route query
4. Preserve current `userId` device filter if present
5. Leave the operator inside the current device context, not bounce them elsewhere

### After context-jump actions
Frontend should:
- preserve the target context in route query
- make the filter or detail state visually obvious on arrival

---

## UI Placement Rules

### User detail drawer
Add a dedicated **操作** section after status / activity and before lower-priority informational content.

V1 user action controls:
- 启用用户 / 禁用用户
- 查看设备

### Device detail drawer
Add a dedicated **操作** section after identity / ownership information.

V1 device action controls:
- 查看用户
- 移除设备 / 解绑设备

---

## Safety & UX Rules

- Every mutating action must show loading state while in flight
- Disable repeat-click during mutation
- Always show success / failure feedback through `ElMessage`
- Destructive actions must be visually distinct from navigation actions
- Route state and list highlight state should remain consistent after actions whenever possible

---

## Backend Contract Expectations

### User status API
- Input: user id + target status
- Validation: only allowed status values for V1 (`0` and `1`)
- Output: success result plus enough data to refresh UI cleanly
- Logging: include target id and changed status

### Device remove / unbind API
- Input: device id
- Validation: target device must exist
- Output: success result plus removed target id
- Logging: include device id and related user id when available

---

## Success Criteria for V1

V1 is considered complete when all of the following are true:

1. Admin can enable / disable a user from user detail drawer
2. Admin can jump from user detail to filtered device list
3. Admin can remove a device from device detail drawer with confirmation
4. Admin can jump from device detail back to user detail
5. List/detail/route state stays coherent after each action
6. All related pages still pass `npm run build`
