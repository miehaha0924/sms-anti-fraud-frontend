<template>
  <div class="analysis-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>分析报告</h2>
        <p class="page-desc">诈骗号码聚类、规则与LLM差异分析、候选规则与黑名单溯源</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
        <el-button type="primary" @click="onRefresh" :icon="Refresh">确认</el-button>
      </div>
    </div>

    <!-- Stats Overview -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-primary clickable" @click="scrollToSection('clusters-section')">
          <div class="stat-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ store.clusters.length }}</div>
            <div class="stat-label">诈骗聚类</div>
          </div>
          <div class="stat-arrow"><el-icon><ArrowRight /></el-icon></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-warning clickable" @click="scrollToSection('diffs-section')">
          <div class="stat-icon">
            <el-icon><Odometer /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ store.diffs.length }}</div>
            <div class="stat-label">规则差异</div>
          </div>
          <div class="stat-arrow"><el-icon><ArrowRight /></el-icon></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-success clickable" @click="scrollToSection('candidates-section')">
          <div class="stat-icon">
            <el-icon><DocumentChecked /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ store.candidateRules.length }}</div>
            <div class="stat-label">候选规则</div>
          </div>
          <div class="stat-arrow"><el-icon><ArrowRight /></el-icon></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-danger clickable" @click="scrollToSection('blacklist-section')">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 960c237.7 0 430-192.3 430-430S749.7 100 512 100 82 292.3 82 530s192.3 430 430 430z m0-700c149.1 0 270 120.9 270 270S661.1 800 512 800 242 679.1 242 530 362.9 260 512 260z" fill="currentColor"/><path d="M556 746h-88v-88h88v88z" fill="currentColor"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ store.blacklistTracebacks.length }}</div>
            <div class="stat-label">黑名单溯源</div>
          </div>
          <div class="stat-arrow"><el-icon><ArrowRight /></el-icon></div>
        </div>
      </el-col>
    </el-row>

    <!-- Content Grid -->
    <div class="content-stack">
      <!-- Fraud Clusters Card -->
      <el-card shadow="hover" class="content-card" id="clusters-section">
          <template #header>
            <div class="card-header">
              <div class="header-left-inline">
                <div class="card-icon primary">
                  <el-icon><Connection /></el-icon>
                </div>
                <span class="card-title">诈骗号码聚类</span>
              </div>
              <el-button link type="primary" size="small" @click="loadClusters">
                {{ showClusters ? '收起' : '展开' }}
                <el-icon class="expand-icon" :class="{ expanded: showClusters }">
                  <ArrowDown />
                </el-icon>
              </el-button>
            </div>
          </template>
          <div class="table-wrapper" v-if="showClusters" v-loading="store.loading">
            <el-table :data="paginatedClusters" stripe class="compact-table" :max-height="400">
              <el-table-column type="index" :index="(i) => clustersOffset + i + 1" label="#" width="60" align="center" />
              <el-table-column prop="cluster_key_type" label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain" type="primary">{{ row.cluster_key_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="cluster_key_value" label="聚类值" min-width="200">
                <template #default="{ row }">
                  <span class="cluster-value">{{ row.cluster_key_value }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="caller_count" label="号码数" width="100" align="center">
                <template #default="{ row }">
                  <span class="num-value primary">{{ row.caller_count }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="sms_count" label="短信数" width="100" align="center">
                <template #default="{ row }">
                  <span class="num-value warning">{{ row.sms_count }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="risk_reason" label="风险原因" min-width="250" show-overflow-tooltip />
            </el-table>
            <div class="table-pagination" v-if="store.clusters.length > clustersPageSize">
              <el-pagination
                v-model:current-page="clustersPage"
                :page-size="clustersPageSize"
                :total="store.clusters.length"
                layout="prev, pager, next"
                small
                background
              />
            </div>
            <div v-if="store.clusters.length === 0" class="empty-state">
              <el-empty description="暂无聚类数据" :image-size="80" />
            </div>
          </div>
          <div v-if="!showClusters" class="collapsed-hint" @click="loadClusters">
            点击展开查看详情 ({{ store.clusters.length }} 条数据)
          </div>
        </el-card>

        <!-- Candidate Rules Card -->
        <el-card shadow="hover" class="content-card" id="candidates-section">
          <template #header>
            <div class="card-header">
              <div class="header-left-inline">
                <div class="card-icon success">
                  <el-icon><DocumentChecked /></el-icon>
                </div>
                <span class="card-title">候选规则</span>
              </div>
              <el-button link type="primary" size="small" @click="loadCandidates">
                {{ showCandidates ? '收起' : '展开' }}
                <el-icon class="expand-icon" :class="{ expanded: showCandidates }">
                  <ArrowDown />
                </el-icon>
              </el-button>
            </div>
          </template>
          <div class="table-wrapper" v-if="showCandidates" v-loading="store.loading">
            <el-table :data="paginatedCandidates" stripe class="compact-table" :max-height="400">
              <el-table-column type="index" :index="(i) => candidatesOffset + i + 1" label="#" width="60" align="center" />
              <el-table-column prop="rule_type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.rule_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="规则内容" min-width="500">
                <template #default="{ row }">
                  <el-tooltip placement="top" :width="600" effect="light">
                    <template #content>
                      <pre class="json-content">{{ JSON.stringify(row.rule_payload || {}, null, 2) }}</pre>
                    </template>
                    <code class="rule-payload-full">{{ JSON.stringify(row.rule_payload || {}) }}</code>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="validation_status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusTagType(row.validation_status)" effect="light" round>
                    {{ getStatusText(row.validation_status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="simulateCandidate(row)">模拟</el-button>
                  <el-button link type="success" size="small" @click="approveCandidate(row)">通过</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-pagination" v-if="store.candidateRules.length > candidatesPageSize">
              <el-pagination
                v-model:current-page="candidatesPage"
                :page-size="candidatesPageSize"
                :total="store.candidateRules.length"
                layout="prev, pager, next"
                small
                background
              />
            </div>
            <div v-if="store.candidateRules.length === 0" class="empty-state">
              <el-empty description="暂无候选规则" :image-size="80" />
            </div>
          </div>
          <div v-if="!showCandidates" class="collapsed-hint" @click="loadCandidates">
            点击展开查看详情 ({{ store.candidateRules.length }} 条数据)
          </div>
        </el-card>

        <!-- Diffs Card -->
        <el-card shadow="hover" class="content-card" id="diffs-section">
          <template #header>
            <div class="card-header">
              <div class="header-left-inline">
                <div class="card-icon warning">
                  <el-icon><Odometer /></el-icon>
                </div>
                <span class="card-title">规则 vs LLM 差异分析</span>
              </div>
              <el-button link type="primary" size="small" @click="loadDiffs">
                {{ showDiffs ? '收起' : '展开' }}
                <el-icon class="expand-icon" :class="{ expanded: showDiffs }">
                  <ArrowDown />
                </el-icon>
              </el-button>
            </div>
          </template>
          <div class="table-wrapper" v-if="showDiffs" v-loading="store.loading">
            <el-table :data="paginatedDiffs" stripe class="compact-table" :max-height="400">
              <el-table-column type="index" :index="(i) => diffsOffset + i + 1" label="#" width="60" align="center" />
              <el-table-column prop="caller" label="号码" width="130">
                <template #default="{ row }">
                  <code class="phone-code">{{ maskPhone(row.caller) }}</code>
                </template>
              </el-table-column>
              <el-table-column label="规则判定" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.rule_label === 'spam' ? 'danger' : 'success'" size="small" effect="light" round>
                    {{ row.rule_label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="LLM判定" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.llm_label === 'spam' ? 'danger' : 'success'" size="small" effect="light" round>
                    {{ row.llm_label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="diff_type" label="差异类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="info" effect="plain">{{ row.diff_type || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="rule_reason" label="规则原因" min-width="200" show-overflow-tooltip />
              <el-table-column prop="llm_reason" label="LLM原因" min-width="200" show-overflow-tooltip />
            </el-table>
            <div class="table-pagination" v-if="store.diffs.length > diffsPageSize">
              <el-pagination
                v-model:current-page="diffsPage"
                :page-size="diffsPageSize"
                :total="store.diffs.length"
                layout="prev, pager, next"
                small
                background
              />
            </div>
            <div v-if="store.diffs.length === 0" class="empty-state">
              <el-empty description="暂无差异数据" :image-size="80" />
            </div>
          </div>
          <div v-if="!showDiffs" class="collapsed-hint" @click="loadDiffs">
            点击展开查看详情 ({{ store.diffs.length }} 条数据)
          </div>
        </el-card>

        <!-- Blacklist Traceback Card -->
        <el-card shadow="hover" class="content-card" id="blacklist-section">
          <template #header>
            <div class="card-header">
              <div class="header-left-inline">
                <div class="card-icon danger">
                  <svg width="16" height="16" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 960c237.7 0 430-192.3 430-430S749.7 100 512 100 82 292.3 82 530s192.3 430 430 430z m0-700c149.1 0 270 120.9 270 270S661.1 800 512 800 242 679.1 242 530 362.9 260 512 260z" fill="currentColor"/><path d="M556 746h-88v-88h88v88z" fill="currentColor"/></svg>
                </div>
                <span class="card-title">黑名单溯源</span>
              </div>
              <el-button link type="primary" size="small" @click="loadBlacklists">
                {{ showBlacklists ? '收起' : '展开' }}
                <el-icon class="expand-icon" :class="{ expanded: showBlacklists }">
                  <ArrowDown />
                </el-icon>
              </el-button>
            </div>
          </template>
          <div class="table-wrapper" v-if="showBlacklists" v-loading="store.loading">
            <el-table :data="paginatedBlacklists" stripe class="compact-table" :max-height="400">
              <el-table-column type="index" :index="(i) => blacklistOffset + i + 1" label="#" width="60" align="center" />
              <el-table-column prop="hit_type" label="命中类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.hit_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="hit_value" label="命中值" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span>{{ maskPhone(row.hit_value) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="matched_sms_count" label="短信数" width="100" align="center">
                <template #default="{ row }">
                  <span class="num-value primary">{{ row.matched_sms_count }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="matched_caller_count" label="号码数" width="100" align="center">
                <template #default="{ row }">
                  <span class="num-value warning">{{ row.matched_caller_count }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="table-pagination" v-if="store.blacklistTracebacks.length > blacklistPageSize">
              <el-pagination
                v-model:current-page="blacklistPage"
                :page-size="blacklistPageSize"
                :total="store.blacklistTracebacks.length"
                layout="prev, pager, next"
                small
                background
              />
            </div>
            <div v-if="store.blacklistTracebacks.length === 0" class="empty-state">
              <el-empty description="暂无溯源数据" :image-size="80" />
            </div>
          </div>
          <div v-if="!showBlacklists" class="collapsed-hint" @click="loadBlacklists">
            点击展开查看详情 ({{ store.blacklistTracebacks.length }} 条数据)
          </div>
        </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSmsStore } from '@/stores/sms'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Refresh, Connection, Odometer, DocumentChecked, ArrowDown, ArrowRight } from '@element-plus/icons-vue'

const store = useSmsStore()
const authStore = useAuthStore()
const selectedDate = ref(new Date().toISOString().slice(0, 10))

// 号码脱敏函数
const maskPhone = (phone) => {
  if (!phone || authStore.isAdmin) return phone
  if (phone.length <= 7) return phone.slice(0, 3) + '****'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 点击加载状态
const showDiffs = ref(false)
const showCandidates = ref(false)
const showClusters = ref(false)
const showBlacklists = ref(false)

// 点击加载详情
const loadClusters = async () => {
  if (!showClusters.value) {
    showClusters.value = true
  } else {
    showClusters.value = false
  }
}

const loadDiffs = async () => {
  if (!showDiffs.value) {
    showDiffs.value = true
  } else {
    showDiffs.value = false
  }
}

const loadCandidates = async () => {
  if (!showCandidates.value) {
    showCandidates.value = true
  } else {
    showCandidates.value = false
  }
}

const loadBlacklists = async () => {
  if (!showBlacklists.value) {
    showBlacklists.value = true
  } else {
    showBlacklists.value = false
  }
}

// 滚动到指定区域
const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // 触发展开
  if (id === 'clusters-section') loadClusters()
  if (id === 'diffs-section') loadDiffs()
  if (id === 'candidates-section') loadCandidates()
  if (id === 'blacklist-section') loadBlacklists()
}

// 分页状态
const diffsPage = ref(1)
const diffsPageSize = ref(10)
const candidatesPage = ref(1)
const candidatesPageSize = ref(10)
const blacklistPage = ref(1)
const blacklistPageSize = ref(10)
const clustersPage = ref(1)
const clustersPageSize = ref(10)

// 分页计算
const diffsOffset = computed(() => (diffsPage.value - 1) * diffsPageSize.value)
const paginatedDiffs = computed(() =>
  store.diffs.slice(diffsOffset.value, diffsOffset.value + diffsPageSize.value)
)

const candidatesOffset = computed(() => (candidatesPage.value - 1) * candidatesPageSize.value)
const paginatedCandidates = computed(() =>
  store.candidateRules.slice(candidatesOffset.value, candidatesOffset.value + candidatesPageSize.value)
)

const blacklistOffset = computed(() => (blacklistPage.value - 1) * blacklistPageSize.value)
const paginatedBlacklists = computed(() =>
  store.blacklistTracebacks.slice(blacklistOffset.value, blacklistOffset.value + blacklistPageSize.value)
)

const clustersOffset = computed(() => (clustersPage.value - 1) * clustersPageSize.value)
const paginatedClusters = computed(() =>
  store.clusters.slice(clustersOffset.value, clustersOffset.value + clustersPageSize.value)
)

const onRefresh = async () => {
  const params = { task_date: selectedDate.value }
  await Promise.all([
    store.fetchClusters(params),
    store.fetchDiffs(params),
    store.fetchCandidateRules(params),
    store.fetchBlacklistTraceback(params),
  ])
}

const approveCandidate = async (row) => {
  try {
    await store.approveRule(row.id)
    ElMessage.success('规则已通过')
    await onRefresh()
  } catch {
    ElMessage.error('操作失败')
  }
}

const simulateCandidate = async (row) => {
  try {
    const result = await store.simulateRule(row.id)
    ElMessage.info(`模拟结果: ${result.simulation_result?.accepted ? '通过' : '拒绝'}`)
    await onRefresh()
  } catch {
    ElMessage.error('模拟失败')
  }
}

const formatRuleContent = (payload) => {
  if (!payload) return '-'
  const json = JSON.stringify(payload)
  return json.length > 200 ? json.slice(0, 200) + '...' : json
}

const getStatusTagType = (status) => ({
  draft: 'info',
  simulating: 'warning',
  enabled: 'success'
}[status] || 'info')

const getStatusText = (status) => ({
  draft: '草稿',
  simulating: '模拟中',
  enabled: '已启用'
}[status] || status)

onMounted(() => {
  onRefresh()
})
</script>

<style scoped>
.analysis-page {
  width: 100%;
  padding: 0 4px;
  font-size: 14px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 36px;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: 2px;
  background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-desc {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 16px;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.date-picker :deep(.el-input__wrapper) {
  background: #f8fafc;
  border-radius: 8px;
}

/* Stats Row */
.stats-row {
  margin-bottom: 24px;
}

.content-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.stat-card.clickable:hover .stat-arrow {
  opacity: 1;
  transform: translateX(0);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
}

.stat-primary .stat-icon { background: linear-gradient(135deg, #6366f1, #818cf8); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-success .stat-icon { background: linear-gradient(135deg, #10b981, #34d399); }
.stat-danger .stat-icon { background: linear-gradient(135deg, #ef4444, #f87171); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 40px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 15px;
  color: var(--text-secondary);
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.stat-arrow {
  opacity: 0.3;
  transform: translateX(-8px);
  transition: all 0.2s ease;
  color: #94a3b8;
  font-size: 18px;
}

/* Content Cards */
.content-card {
  border-radius: 16px;
  border: none;
}

.content-card :deep(.el-card__header) {
  padding: 18px 22px;
  border-bottom: 1px solid #f1f5f9;
}

.content-card :deep(.el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
}

.card-icon.primary { background: linear-gradient(135deg, #6366f1, #818cf8); }
.card-icon.warning { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.card-icon.success { background: linear-gradient(135deg, #10b981, #34d399); }
.card-icon.danger { background: linear-gradient(135deg, #ef4444, #f87171); }

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.expand-icon {
  margin-left: 4px;
  transition: transform 0.2s ease;
  font-size: 14px;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* Table Styles */
.table-wrapper {
  min-height: 100px;
}

.table-pagination {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
}

.compact-table {
  font-size: 14px;
}

.compact-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.compact-table :deep(.el-table__row) {
  transition: background 0.15s ease;
}

.compact-table :deep(.el-table__row:hover) {
  background: #f8fafc;
}

.cluster-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #475569;
}

.phone-code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  color: #334155;
}

.hit-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #475569;
}

.num-value {
  font-weight: 700;
  font-size: 15px;
}

.num-value.primary { color: #6366f1; }
.num-value.warning { color: #f59e0b; }

.rule-payload {
  display: inline-block;
  max-width: 100%;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  color: #334155;
  max-width: 360px;
}

.rule-payload-full {
  display: inline-block;
  max-width: 100%;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  color: #334155;
  max-width: 480px;
}

.rule-payload:hover, .rule-payload-full:hover {
  background: #e2e8f0;
}

.json-content {
  max-width: 480px;
  max-height: 300px;
  overflow: auto;
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
}

.collapsed-hint {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  background: #fafbfc;
  border-radius: 0 0 16px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapsed-hint:hover {
  background: #f1f5f9;
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .stat-card {
    padding: 16px;
    gap: 12px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }

  .stat-value {
    font-size: 26px;
  }

  .card-title {
    font-size: 15px;
  }
}
</style>
