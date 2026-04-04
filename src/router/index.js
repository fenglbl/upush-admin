import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PushRecordsView from '../views/PushRecordsView.vue'
import PushBatchDetailView from '../views/PushBatchDetailView.vue'
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
      component: PlaceholderView,
      meta: {
        title: '新建推送',
        subtitle: '后续接入推送表单页'
      }
    },
    {
      path: '/logs',
      name: 'logs',
      component: PlaceholderView,
      meta: {
        title: '日志中心',
        subtitle: '后续接入完整日志页面'
      }
    }
  ]
})

export default router
