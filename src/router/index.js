import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
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
      component: PlaceholderView,
      meta: {
        title: '推送记录',
        subtitle: '后续接入完整推送记录页'
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
