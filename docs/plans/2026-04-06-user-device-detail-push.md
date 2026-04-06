# User & Device Detail Push Message Plan

> Scope intentionally small: add a push-message action in user/device detail drawers, reuse the existing push-create flow, and support both user-target push and single-device push with minimal backend changes.

## Goal
- In **用户管理** detail drawer, add a **推送消息** action that opens a dialog prefilled for the current user.
- In **设备管理** detail drawer, add a **推送消息** action that opens a dialog prefilled for the current device.
- Reuse existing `PushCreateForm.vue` instead of creating a brand-new push module.
- Extend backend push capability just enough to support **single-device push**.

## Task 1 — Extend backend push cloudfunction for target modes
**Files**
- Modify: `E:\Desktop\upush\upushServer\cloudfunctions\push\index.js`
- Modify if needed: `E:\Desktop\upush\upushServer\routes\pushMessage\index.js`

**Implementation**
- Keep existing default behavior: if only `id` is provided, treat it as **user push**.
- Add optional target fields such as:
  - `targetType: 'user' | 'device'`
  - `deviceId` (single device record id or raw device id)
- For `targetType='device'`:
  - find the exact target device record
  - push only to that one device
  - keep batch/result structure compatible with current admin records
- Keep existing `/pushMessage` contract working for user push.

**Verify**
- API call with user target still works
- API call with device target sends only one device and returns a normal batch/result payload

## Task 2 — Make PushCreateForm reusable with prefill + target mode
**Files**
- Modify: `E:\Desktop\upush\upush-admin\src\components\PushCreateForm.vue`

**Implementation**
- Add props for prefilled target context, e.g.:
  - `targetType`
  - `userId`
  - `deviceId`
  - `deviceLabel`
- Update form copy so it can show:
  - current target is user
  - current target is device
- Preserve current freeform mode for Push Records page.
- On submit:
  - user mode → existing `id` payload
  - device mode → send `targetType='device'` + device identifier

**Verify**
- Existing Push Records page still works
- Form can render locked/prefilled target summary correctly

## Task 3 — Add push action to UsersView detail drawer
**Files**
- Modify: `E:\Desktop\upush\upush-admin\src\views\UsersView.vue`

**Implementation**
- Add a `推送消息` button in the user detail operation area.
- Open an `el-dialog` reusing `PushCreateForm`.
- Prefill current user id and lock target to this user context.
- On success:
  - show success feedback
  - close dialog
  - keep current user detail drawer/context intact

**Verify**
- Build passes
- Clicking user detail push opens correct dialog with current user target

## Task 4 — Add push action to DevicesView detail drawer
**Files**
- Modify: `E:\Desktop\upush\upush-admin\src\views\DevicesView.vue`

**Implementation**
- Add a `推送消息` button in the device detail operation area.
- Open an `el-dialog` reusing `PushCreateForm`.
- Prefill current device target context.
- On success:
  - show success feedback
  - close dialog
  - keep current device detail/context intact

**Verify**
- Build passes
- Clicking device detail push opens correct dialog with current device target

## Task 5 — Final verification
**Verify**
- `npm run build` in `upush-admin` passes
- Backend starts successfully
- `/pushMessage` supports:
  - user-target push
  - device-target push
- User/device detail dialogs open and submit expected payload shapes
