# upush-admin Sprint 1 详细计划

日期：2026-04-04  
状态：Planned  
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

### 模块 B：新建推送页接真实接口
- 表单提交 `POST /pushMessage`
- 提交结果提示
- 提交成功后跳转批次详情页

### 模块 C：日志管理页第一版
- 日志页接 `/logs`
- 支持日期/级别/关键词筛选
- 从批次详情跳日志（带关键词）

---

## 3. 不在本 Sprint（Out of Scope）

- 用户管理/设备管理
- 协议管理/版本管理
- 权限体系完整接入
- 大规模重构 UI 架构

---

## 4. 任务拆解（可执行）

## Task S1-1：推送记录页状态统计卡

**目标**  
在记录页顶部展示当前筛选条件下的状态分布（成功/部分失败/失败/无设备）。

**输入**  
`GET /admin/push-batches` 当前返回 `list`。

**执行步骤**
1. 在记录页基于 `list` 计算四类数量
2. 加统计卡 UI
3. 卡片与当前筛选条件联动刷新

**验收标准**
- 筛选条件变化后统计卡同步变化
- 空列表时四类均为 0

---

## Task S1-2：批次详情页失败过滤 + 复制能力

**目标**  
缩短排障路径，重点看失败项并快速复制关键 id。

**执行步骤**
1. 增加“仅看失败”开关（过滤 `results`）
2. 增加复制按钮：`batchId` / `messageId` / `deviceId`
3. 复制成功失败提示

**验收标准**
- 开关后只显示 `ok=false` 项
- 三类 id 都可一键复制
- 复制后有明确 UI 反馈

---

## Task S1-3：批次详情页 providerResponse 展示优化

**目标**  
让第三方返回信息可读可查。

**执行步骤**
1. 增加 providerResponse 折叠区
2. JSON 美化展示（等宽字体）
3. 长内容滚动与换行处理

**验收标准**
- 成功与失败项都可查看 providerResponse
- 长 JSON 不会撑坏布局

---

## Task S1-4：新建推送页接真实接口

**目标**  
打通“从后台发一条真实推送”的执行能力。

**依赖接口**
- `POST /pushMessage`

**执行步骤**
1. 新建推送页表单（id/title/content/payload）
2. 前端校验（必填、JSON payload 可解析）
3. 提交后显示 loading
4. 返回成功后提取 `batchId`，跳 `/push-records/:id`
5. 返回失败时展示错误原因（code/msg/provider）

**验收标准**
- 可成功提交并跳批次详情
- 失败场景有可读错误提示

---

## Task S1-5：日志管理页第一版

**目标**  
初步具备日志检索能力，支撑排障闭环。

**依赖接口**
- `GET /logs`

**执行步骤**
1. 新建日志页（表格）
2. 接入筛选：date/level/keyword/limit/order
3. 支持手动刷新
4. 处理空态/错误态

**验收标准**
- 可按条件查到日志
- 空结果和异常场景可用

---

## Task S1-6：批次详情到日志页联动

**目标**  
从“看到失败”快速跳到“看到日志证据”。

**执行步骤**
1. 批次详情加“查看相关日志”按钮
2. 跳转到日志页并带关键词（如 title/providerMsg/batchId）
3. 日志页自动按 query 初始化检索

**验收标准**
- 一键跳转后可直接看到相关日志候选

---

## 5. 接口清单（Sprint 1）

已有可直接使用：
- `GET /admin/dashboard`
- `GET /admin/push-batches`
- `GET /admin/push-batches/:id`
- `POST /pushMessage`
- `GET /logs`

可能补充（可选）：
- `GET /admin/push-batches/stats`（后续可做服务端统计，减少前端计算）

---

## 6. 页面清单（Sprint 1）

- `Dashboard`（增强跳转与状态提示）
- `PushRecordsView`（增强统计卡）
- `PushBatchDetailView`（失败过滤/复制/providerResponse）
- `PushCreateView`（新建推送）
- `LogsView`（日志管理）

---

## 7. 联调回归清单

1. 新建推送提交成功 -> 自动跳批次详情
2. 批次详情失败项筛选生效
3. providerResponse 展示正确
4. 从详情跳日志后可命中相关记录
5. 记录页筛选 + 分页 + 状态统计一致
6. 所有页面在“空数据/接口异常”下可用

---

## 8. 风险与预案

1. **中文编码显示异常**
   - 预案：统一 UTF-8，核查接口响应头与日志文件编码

2. **推送失败噪声高（大量 invalid device）**
   - 预案：在详情页优先聚合展示失败原因类型

3. **日志检索性能波动**
   - 预案：默认 limit 控制 + 关键词筛选 + 分页/分段读取

---

## 9. Sprint 完成定义（DoD）

满足以下即视为 Sprint 1 完成：

- 推送执行链路可闭环：新建推送 -> 批次详情
- 批次详情可高效排障：失败过滤 + providerResponse + 复制
- 日志管理页可用，并能从批次详情联动进入
- 关键页面通过构建与基础联调验证
