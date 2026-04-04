# upush-admin Sprint 1 详细计划

日期：2026-04-04  
状态：Partially Done / Deferred  
关联总纲：`docs/plans/2026-04-04-upush-admin-master-plan.md`

---

## 1. Sprint 目标

在本 Sprint 内把 `upush-admin` 做到“可运营、可排障”的第一阶段可用版本：

1. 批次页排障能力增强（更快定位失败）
2. 推送执行链路打通（新建推送 -> 批次详情）
3. 日志联动打通（批次异常 -> 日志排查）

---

## 2. Sprint 范围（In Scope）

### 模块 A：推送记录/批次详情增强
- 推送记录页顶部状态统计卡
- 批次详情页：失败筛选、复制能力、providerResponse 展示
- 批次详情页：失败原因聚合统计

### 模块 B：新建推送页接真实接口
- 表单提交 `POST /pushMessage`
- 提交结果提示
- 提交成功后跳转批次详情页
- payload 模板能力

### 模块 C：日志管理页第一版
- 日志页接 `/logs`
- 支持日期/级别/关键词/message/limit/order 筛选
- 从批次详情跳日志（带关键词）
- URL query 同步筛选条件

---

## 3. 不在本 Sprint（Out of Scope）

- 用户管理/设备管理
- 协议管理/版本管理
- 权限体系完整接入
- 大规模重构 UI 架构

---

## 4. 已完成（Completed）

### Task S1-1：推送记录页状态统计卡
**状态**：Done
- 已在 `PushRecordsView` 增加顶部状态统计卡
- 已与当前页列表数据联动

### Task S1-2：批次详情页失败过滤 + 复制能力
**状态**：Done
- 已支持仅看失败
- 已支持复制 `batchId / messageId / deviceId`

### Task S1-3：批次详情页 providerResponse 展示优化
**状态**：Done
- 已支持 providerResponse 折叠展示
- 已支持 JSON 美化展示

### Task S1-4：新建推送页接真实接口
**状态**：Done
- 已完成 `PushCreateView`
- 已接 `POST /pushMessage`
- 已支持提交成功后跳批次详情
- 已补 payload 模板能力

### Task S1-5：日志管理页第一版
**状态**：Done
- 已完成 `LogsView`
- 已接 `GET /logs`
- 已支持基础筛选、刷新、URL query 同步

### Task S1-6：批次详情到日志页联动
**状态**：Done
- 已支持从批次详情跳日志页
- 已带关键词联动日志查询

### Task S1-7：排障体验补强
**状态**：Done
- 已支持批次详情失败原因聚合统计
- 已支持日志页点击 message 后快速按此筛选

---

## 5. 待处理（Backlog / TODO）

这些不影响 Sprint 1 主体闭环，先记入待处理，后续可回头做：

1. **批次详情页失败原因支持点击后直接跳日志**
2. **日志页空态/错误态文案继续细化**
3. **Dashboard / 记录页 / 详情页交互文案统一收口**
4. **可选：后端增加 `/admin/push-batches/stats` 服务端统计接口**
5. **可选：失败原因聚合支持按 providerCode 分组**

---

## 6. 接口清单（Sprint 1）

已使用：
- `GET /admin/dashboard`
- `GET /admin/push-batches`
- `GET /admin/push-batches/:id`
- `POST /pushMessage`
- `GET /logs`

可选后续增强：
- `GET /admin/push-batches/stats`

---

## 7. 页面清单（Sprint 1）

已落地：
- `Dashboard`
- `PushRecordsView`
- `PushBatchDetailView`
- `PushCreateView`
- `LogsView`

---

## 8. Sprint 1 结果结论

Sprint 1 主目标已经达成：
- 推送执行链路可闭环：新建推送 -> 批次详情
- 批次详情具备基础高效排障能力
- 日志管理页可用，并已打通联动
- 关键页面已通过构建验证

后续残余细节已转入 Backlog，当前进入 Sprint 2。
