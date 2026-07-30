<template>
  <div id="app">
    <router-view v-if="isLoginPage" />
    <el-container v-else class="layout-container">
      <el-aside :width="isCollapse ? '72px' : '260px'" class="aside">
        <div class="logo">
          <div class="logo-icon-wrap">
            <el-icon :size="24" color="#fff"><Message /></el-icon>
          </div>
          <span v-show="!isCollapse" class="logo-title">涉诈短信分析平台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          router
          background-color="transparent"
          text-color="#94a3b8"
          active-text-color="#fff"
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>数据概览</template>
          </el-menu-item>
          <el-menu-item index="/sms-list">
            <el-icon><List /></el-icon>
            <template #title>号码研判</template>
          </el-menu-item>
          <el-menu-item index="/analysis-report">
            <el-icon><TrendCharts /></el-icon>
            <template #title>分析报告</template>
          </el-menu-item>
          <el-menu-item index="/import-management">
            <el-icon><Upload /></el-icon>
            <template #title>文件导入</template>
          </el-menu-item>
          <el-menu-item index="/task-list">
            <el-icon><Setting /></el-icon>
            <template #title>任务管理</template>
          </el-menu-item>
          <el-sub-menu v-if="authStore.isAdmin" index="/admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理面板</span>
            </template>
            <el-menu-item index="/admin/worker-mode">Worker模式</el-menu-item>
            <el-menu-item index="/admin/rules">策略管理</el-menu-item>
            <el-menu-item index="/admin/phone-mask">电话屏蔽</el-menu-item>
          </el-sub-menu>
        </el-menu>

        <div class="sidebar-footer">
          <div class="collapse-btn" @click="toggleCollapse">
            <el-icon v-if="!isCollapse"><Fold /></el-icon>
            <el-icon v-else><Expand /></el-icon>
            <span v-show="!isCollapse" class="collapse-text">收起</span>
          </div>
        </div>
      </el-aside>

      <el-container class="right-container">
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">
                <el-icon><HomeFilled /></el-icon>
                首页
              </el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <div class="header-time">{{ currentTime }}</div>
            <el-dropdown trigger="click">
              <div class="user-info">
                <el-avatar :size="32" style="background: linear-gradient(135deg, var(--primary), var(--primary-light));">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="user-name">{{ authStore.user?.username || "用户" }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人设置</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoginPage = computed(() => route.path === '/login')

const handleLogout = () => {
  authStore.logout()
}
const isCollapse = ref(false)
const currentTime = ref('')

const activeMenu = computed(() => route.path)
const currentRoute = computed(() => {
  const map = {
    '/dashboard': '数据概览',
    '/sms-list': '号码研判',
    '/analysis-report': '分析报告',
    '/import-management': '文件导入',
    '/task-list': '任务管理',
    '/task-detail': '任务详情',
  }
  return map[route.path] || ''
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')
}

let timeInterval
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  background: var(--page-bg);
}

.aside {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 72px;
  padding: 0 20px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.logo-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 12px;
  border: none;
  overflow-y: auto;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: 12px;
  margin-bottom: 4px;
  height: 48px;
  transition: var(--transition);
  font-size: 14px;
  font-weight: 500;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 16px !important;
}

.sidebar-menu :deep(.el-menu-item)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 100%);
  border-radius: 0 3px 3px 0;
  transition: height 0.2s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%) !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.sidebar-menu :deep(.el-menu-item.is-active)::before {
  height: 24px;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
}

.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

.collapse-text {
  white-space: nowrap;
}

.right-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--page-bg);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  padding: 0 28px;
  height: 64px !important;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left :deep(.el-breadcrumb) {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-left :deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.header-left :deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-left :deep(.el-breadcrumb__separator) {
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-time {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Consolas', monospace;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: var(--transition);
}

.user-info:hover {
  background: #f1f5f9;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
  background: var(--page-bg);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
