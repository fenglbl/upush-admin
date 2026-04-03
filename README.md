# upush-admin

`upush-admin` 是 `upush` 的后台管理前端，当前第一版重点是 **Dashboard 首页**：

- 展示今日推送 KPI
- 展示近 `7d / 30d / 24h` 推送趋势
- 展示最近推送结果
- 展示最近异常日志摘要
- 提供少量快捷入口（新建推送、推送记录、日志中心）

当前前端通过 `upushServer` 提供的聚合接口获取数据：

- `GET /admin/dashboard`

## 技术栈

- Vue 3
- Vite
- Vue Router
- Element Plus
- ECharts
- Axios

## 项目结构

```text
src/
  api/            # 接口请求封装
  router/         # 路由配置
  styles/         # 全局样式
  views/          # 页面视图

docs/plans/       # 设计稿与实施计划
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

默认由 Vite 启动本地开发服务。

### 3. 构建

```bash
npm run build
```

## 后端依赖

当前默认请求地址写死为：

```js
http://127.0.0.1:3000
```

接口定义位于：

- `src/api/index.js`

请先确保 `upushServer` 已启动，并且已经挂载：

- `GET /admin/dashboard`

## 当前已完成

- Admin 基础项目骨架
- Dashboard 页面布局
- Dashboard 首页数据接入
- 趋势图渲染
- 最近推送结果区
- 最近异常日志区
- 占位路由：推送记录 / 新建推送 / 日志中心

## 后续规划

- 接入完整推送记录页
- 接入新建推送表单页
- 接入日志中心完整检索页
- 后续按需要再考虑权限、设备、用户等后台能力

## 相关项目

- 前端 App：`upush-app`
- 后端服务：`upushServer`

## 说明

当前第一版 Dashboard 的后端数据来源是 **日志聚合**，不是数据库报表：

- 推送统计来自 `pushMessage executed ...` 日志
- 异常列表来自 `WARN / ERROR` 日志

这套方案适合第一版快速落地，后续如果要做更严肃的统计分析，再逐步演进到数据库/专门统计表。
