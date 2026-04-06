import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PushRecordsView from '../views/PushRecordsView.vue'
import PushBatchDetailView from '../views/PushBatchDetailView.vue'
import LogsView from '../views/LogsView.vue'
import UsersView from '../views/UsersView.vue'
import DevicesView from '../views/DevicesView.vue'
import FeedbackView from '../views/FeedbackView.vue'
import AgreementsView from '../views/AgreementsView.vue'
import AgreementEditorView from '../views/AgreementEditorView.vue'
import VersionsView from '../views/VersionsView.vue'
import VersionEditorView from '../views/VersionEditorView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import { getAdminToken } from '../api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: '登录',
        public: true
      }
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
      component: DevicesView,
      meta: {
        title: '设备管理',
        subtitle: '设备列表与详情'
      }
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: FeedbackView,
      meta: {
        title: '反馈中心',
        subtitle: '用户反馈查看与回复'
      }
    },
    {
      path: '/agreements',
      name: 'agreements',
      component: AgreementsView,
      meta: {
        title: '协议管理',
        subtitle: '协议列表与版本发布'
      }
    },
    {
      path: '/agreements/new',
      name: 'agreement-create',
      component: AgreementEditorView,
      meta: {
        title: '新建协议',
        subtitle: '独立页面富文本编辑'
      }
    },
    {
      path: '/agreements/:id/edit',
      name: 'agreement-edit',
      component: AgreementEditorView,
      meta: {
        title: '编辑协议',
        subtitle: '独立页面富文本编辑'
      }
    },
    {
      path: '/versions',
      name: 'versions',
      component: VersionsView,
      meta: {
        title: '版本管理',
        subtitle: '客户端版本列表与发布'
      }
    },
    {
      path: '/versions/new',
      name: 'version-create',
      component: VersionEditorView,
      meta: {
        title: '新建版本',
        subtitle: '独立页面编辑版本信息'
      }
    },
    {
      path: '/versions/:id/edit',
      name: 'version-edit',
      component: VersionEditorView,
      meta: {
        title: '编辑版本',
        subtitle: '独立页面编辑版本信息'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        title: '系统设置',
        subtitle: '推送、日志与界面配置'
      }
    }
  ]
})

router.beforeEach((to) => {
  const hasToken = !!getAdminToken()
  if (to.meta && to.meta.public) {
    if (to.path === '/login' && hasToken) {
      return '/dashboard'
    }
    return true
  }

  if (!hasToken) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  return true
})

export default router
