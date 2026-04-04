# upush-admin Sprint 2 详细计划

日期：2026-04-04  
状态：Mostly Done  
关联总纲：`docs/plans/2026-04-04-upush-admin-master-plan.md`

---

## 1. Sprint 目标

进入平台治理能力建设阶段，优先补后台的 **基础管理能力**，让 `upush-admin` 从“推送工作台”逐步升级为“运营后台”。

Sprint 2 建议聚焦：
1. 系统设置（P0）
2. 用户管理（P1）
3. 设备管理（P1）

> 说明：反馈中心/协议管理/版本管理先不进入本 Sprint 主范围，避免铺太散。

---

## 2. Sprint 范围（In Scope）

### 模块 A：系统设置（优先）
- 配置项列表/表单
- 配置读取与保存
- 基础分组（如推送、日志、界面）

### 模块 B：用户管理（第一版）
- 用户列表
- 搜索/分页
- 用户详情基础信息

### 模块 C：设备管理（第一版）
- 设备列表
- 在线状态/所属用户/最近活跃
- 基础筛选与详情

---

## 3. 暂不纳入本 Sprint

- 反馈意见及回复
- 协议管理
- 版本管理
- 完整权限体系
- 审计系统完整化

---

## 4. 任务拆解（建议执行顺序）

## Task S2-1：梳理系统设置数据模型

**目标**  
先明确后台“设置”到底有哪些分组和字段，避免先写死再返工。

**执行步骤**
1. 列出第一批设置项（推送、日志、界面）
2. 给每个配置定义字段类型（string/number/boolean/json）
3. 明确保存方式（配置文件 / 数据库 / 接口）

**产出**
- 设置项清单
- 数据结构说明

---

## Task S2-2：系统设置页第一版

**目标**  
落一个可编辑、可保存、可回显的设置页面。

**执行步骤**
1. 新建 `SettingsView`
2. 配置分组展示
3. 支持编辑/保存/重置
4. 成功/失败提示

**验收标准**
- 设置可回显
- 修改后可保存
- 基础异常提示清楚

---

## Task S2-3：用户管理数据源梳理

**目标**  
明确 `uni-id-users` 当前可用于后台展示的字段。

**执行步骤**
1. 梳理用户集合字段
2. 确认需要的列表字段
3. 确认是否已有用户详情所需字段

**产出**
- 用户列表/详情字段表

---

## Task S2-4：用户管理页第一版

**目标**  
做出用户列表 + 基础详情入口。

**执行步骤**
1. 新建用户列表页
2. 支持分页/搜索
3. 显示基础字段（id/username/nickname/email/状态）
4. 预留详情页入口

**验收标准**
- 能查到用户
- 搜索与分页正常

---

## Task S2-5：设备管理数据源梳理

**目标**  
明确 `uni-id-device` 当前字段与用户关联方式。

**执行步骤**
1. 梳理设备集合字段
2. 明确 user_id 关联展示方式
3. 明确状态/活跃时间字段来源

**产出**
- 设备列表字段表

---

## Task S2-6：设备管理页第一版

**目标**  
做出设备列表与基础状态展示。

**执行步骤**
1. 新建设备列表页
2. 支持按用户/设备id/状态筛选
3. 展示设备 id、所属用户、最近活跃、基础状态
4. 预留详情页入口

**验收标准**
- 能查到设备
- 能关联到所属用户

---

## 5. Sprint 2 页面清单

- `SettingsView`
- `UsersView`
- `UserDetailView`（可先占位或基础版）
- `DevicesView`
- `DeviceDetailView`（可先占位或基础版）

---

## 6. Sprint 2 接口/数据清单（预期）

优先复用现有数据库/接口；若不够，再补后端接口。

候选数据源：
- 用户：`uni-id-users`
- 设备：`uni-id-device`
- 设置：待确认（配置文件 / DB / 接口）

可能新增后端接口：
- `GET /admin/users`
- `GET /admin/users/:id`
- `GET /admin/devices`
- `GET /admin/devices/:id`
- `GET /admin/settings`
- `POST /admin/settings`

---

## 7. 当前摸底结论（2026-04-04）

### 7.1 系统设置
- 当前 `upushServer` 没有现成的后台“系统设置”读写接口。
- 现有配置主要分散在：
  - `.env`
  - `db/config.js`
  - `unipush/index.js` 中依赖的环境变量（如 `GETUI_APPKEY / GETUI_MASTERSECRET / GETUI_SERVER_URL`）
- 结论：**Sprint 2 的“系统设置”不适合直接改 `.env`**，建议新增独立的数据来源，例如：
  - MongoDB 集合：`admin-settings`
  - 或 JSON 配置文件（不如 DB 灵活）
- 推荐方向：先做 `admin-settings` 集合 + `GET/POST /admin/settings`。

### 7.2 用户管理
- 当前用户主数据来自 MongoDB 集合：`uni-id-users`
- 已确认可直接用于后台第一版的字段包括：
  - `_id`
  - `username`
  - `nickname`
  - `email`
  - `status`
  - `register_date`
  - `last_login_date`
- 结论：用户管理第一版可以直接从 `uni-id-users` 出列表与详情。

### 7.3 设备管理
- 当前设备主数据来自 MongoDB 集合：`uni-id-device`
- 已确认可直接用于后台第一版的字段包括：
  - `_id`
  - `user_id`
  - `device_id`
  - `create_date`
- 部分预期字段（如更明确的平台、最近活跃）当前不稳定或尚未确认。
- 结论：设备管理第一版先做“设备列表 + 用户关联 + 创建设备时间”，状态/活跃度后补。

---

## 8. Sprint 2 当前完成情况（截至 2026-04-04 晚）

### 已完成

#### S2-1：系统设置数据模型梳理
已完成第一版落地：
- 设置分组确定为：`push / logs / ui`
- 数据源确定为 MongoDB 集合：`admin-settings`
- 采用单例记录模式：`key=default`

#### S2-2：系统设置页第一版
已完成：
- `upush-admin` 新增 `SettingsView`
- 支持配置回显 / 编辑 / 保存 / 重置
- 已接入接口：
  - `GET /admin/settings`
  - `POST /admin/settings`
- 当前页面覆盖三组配置：
  - 推送设置
  - 日志设置
  - 界面设置

#### S2-3 / S2-4：用户管理
已完成第一版：
- 用户列表
- 搜索 / 分页
- 基础详情 drawer
- 数据源：`uni-id-users`
- 接口：
  - `GET /admin/users`
  - `GET /admin/users/:id`

#### S2-5 / S2-6：设备管理
已完成第一版：
- 设备列表
- 按用户筛选
- 基础详情 drawer
- 数据源：`uni-id-device`
- 接口：
  - `GET /admin/devices`
  - `GET /admin/devices/:id`

#### 工程化补充进展
本 Sprint 期间顺手完成了后台公共布局抽象：
- `AdminSidebar`
- `AdminPageLayout`
- `AdminPageHeader`

### 当前遗留的小尾巴
- 系统设置页目前还是“第一版可用”，尚未接入更复杂配置项
- 前端设置值尚未反向驱动 Dashboard / Logs / PushCreate 的默认行为
- 用户/设备页目前使用 drawer 详情，尚未独立拆出详情页路由

## 9. Sprint 2 完成定义（DoD）对照

- 有一个可用的系统设置页第一版 ✅
- 有一个可用的用户管理列表页第一版 ✅
- 有一个可用的设备管理列表页第一版 ✅
- 页面与接口/数据源打通 ✅
- 至少完成一次基础联调与构建验证 ✅

结论：**Sprint 2 主体已完成，可进入收尾提交或转入下一 Sprint。**

## 10. 下一步建议

优先顺序建议：
1. 整理并提交本次 Sprint 2 改动
2. 决定下一块进入：
   - 反馈中心
   - 协议管理
   - 版本管理
3. 若继续优化当前成果，可补：
   - 设置项实际驱动页面默认值
   - 独立 `UserDetailView` / `DeviceDetailView`
   - 更细的系统设置字段与分组
