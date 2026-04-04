import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PushRecordsView from '../views/PushRecordsView.vue'
import PushBatchDetailView from '../views/PushBatchDetailView.vue'
import PushCreateView from '../views/PushCreateView.vue'
import LogsView from '../views/LogsView.vue'
import UsersView from '../views/UsersView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard',
        subtitle: '推送数据看板'
      }
    },
    {
      path: '/push-records',
      name: 'push-records',
      component: PushRecordsView,
      meta: {
        title: '推送记录',
        subtitle: '推送批次列表'
      }
    },
    {
      path: '/push-records/:id',
      name: 'push-record-detail',
      component: PushBatchDetailView,
      meta: {
        title: '批次详情',
        subtitle: '推送批次结果明细'
      }
    },
    {
      path: '/push-create',
      name: 'push-create',
      component: PushCreateView,
      meta: {
        title: '新建推送',
        subtitle: '推送创建与提交'
      }
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView,
      meta: {
        title: '日志中心',
        subtitle: '日志检索与排障'
      }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: {
        title: '用户管理',
        subtitle: '用户列表与详情'
      }
    },
    {
      path: '/devices',
      name: 'devices',
      component: PlaceholderView,
      meta: {
        title: '设备管理',
        subtitle: 'Sprint 2 下一步接设备列表页'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: PlaceholderView,
      meta: {
        title: '系统设置',
        subtitle: '先保留入口，后续补具体设置项'
      }
    }
  ]
})

export default router
