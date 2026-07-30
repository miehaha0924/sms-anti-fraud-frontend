import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '数据概览', requiresAuth: true }
  },
  {
    path: '/sms-list',
    name: 'SmsList',
    component: () => import('@/views/sms-list/index.vue'),
    meta: { title: '号码研判', requiresAuth: true }
  },
  {
    path: '/analysis-report',
    name: 'AnalysisReport',
    component: () => import('@/views/analysis-report/index.vue'),
    meta: { title: '分析报告', requiresAuth: true }
  },
  {
    path: '/import-management',
    name: 'ImportManagement',
    component: () => import('@/views/import-management/index.vue'),
    meta: { title: '文件导入', requiresAuth: true }
  },
  {
    path: '/task-list',
    name: 'TaskList',
    component: () => import('@/views/task-list/index.vue'),
    meta: { title: '任务管理', requiresAuth: true }
  },
  {
    path: '/task-detail',
    name: 'TaskDetail',
    component: () => import('@/views/task-detail/index.vue'),
    meta: { title: '任务详情', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/worker-mode',
    component: () => import('@/views/admin/index.vue'),
    meta: { title: '管理面板', requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'worker-mode',
        name: 'AdminWorkerMode',
        component: () => import('@/views/admin/worker-mode/index.vue'),
        meta: { title: 'Worker模式', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'rules',
        name: 'AdminRules',
        component: () => import('@/views/admin/rules/index.vue'),
        meta: { title: '策略管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'phone-mask',
        name: 'AdminPhoneMask',
        component: () => import('@/views/admin/phone-mask/index.vue'),
        meta: { title: '电话屏蔽', requiresAuth: true, requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 获取 Cookie 中的 session token（用于区分普通刷新和强制刷新）
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }
  const cookieToken = getCookie('fraud_sms_session')
  const localToken = localStorage.getItem('access_token')

  // 只有 Cookie 和 localStorage 都存在且一致时才允许访问受保护路由
  const isValidSession = cookieToken && localToken && cookieToken === localToken

  if (to.meta.requiresAuth && !isValidSession) {
    next('/login')
  } else if (to.path === '/login' && isValidSession) {
    next('/dashboard')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
