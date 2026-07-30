<template>
  <div class="dashboard-page">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-title">
        <h1>数据大屏</h1>
        <p class="header-subtitle">涉诈短信实时监测与统计分析</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="RefreshIcon" circle @click="onRefresh" :loading="store.loading" title="刷新数据" />
      </div>
    </header>

    <!-- Stats Row -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon-wrap">
            <div class="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-label">短信总数</div>
            <div class="stat-value">{{ (store.overview?.total_sms ?? 0).toLocaleString() }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-danger">
          <div class="stat-icon-wrap">
            <div class="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-label">涉诈短信数</div>
            <div class="stat-value">{{ (store.overview?.total_fraud_sms ?? 0).toLocaleString() }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon-wrap">
            <div class="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-label">涉诈号码数</div>
            <div class="stat-value">{{ (store.overview?.total_fraud_callers ?? 0).toLocaleString() }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-success">
          <div class="stat-icon-wrap">
            <div class="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-label">涉诈率</div>
            <div class="stat-value">{{ fraudRateDisplay }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- SMS Trend -->
    <div class="chart-section">
      <div class="section-header">
        <span class="section-title">涉诈短信趋势</span>
        <span class="section-hint">每日涉诈短信数量变化</span>
      </div>
      <div ref="smsTrendRef" class="chart-area trend-chart"></div>
    </div>

    <!-- Caller Trend -->
    <div class="chart-section">
      <div class="section-header">
        <span class="section-title">涉诈号码趋势</span>
        <span class="section-hint">每日涉诈号码数量变化</span>
      </div>
      <div ref="callerTrendRef" class="chart-area trend-chart"></div>
    </div>

    <!-- Bottom Row: Category + Top10 -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :xs="24" :lg="12">
        <div class="card-section">
          <div class="section-header">
            <span class="section-title">诈骗类型分布</span>
            <div class="date-picker-wrap">
              <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                size="small"
                @change="onDateChange"
              />
            </div>
          </div>
          <div ref="categoryRef" class="chart-area category-chart"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="card-section">
          <div class="section-header">
            <span class="section-title">TOP10 诈骗类型</span>
            <span class="section-hint">按涉诈条数排序</span>
          </div>
          <div class="top10-table" v-loading="store.loading">
            <div v-for="(item, index) in top10Data" :key="item.type" class="top10-row">
              <div :class="['rank-badge', rankBadgeClass(index)]">{{ index + 1 }}</div>
              <div class="top10-type">{{ item.type }}</div>
              <div class="top10-bar-wrap">
                <el-progress
                  :percentage="item.rate"
                  :color="rankBarColor(item.rate)"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
              <div class="top10-count">{{ item.count.toLocaleString() }}</div>
            </div>
            <div v-if="top10Data.length === 0 && !store.loading" class="empty-tip">暂无数据</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Running Tasks Bar -->
    <div class="running-tasks-section" v-if="runningTasks.length > 0">
      <div class="section-header">
        <span class="section-title">
          <span class="pulse-dot"></span>
          运行中的任务
        </span>
        <el-tag type="warning" size="small">{{ runningTasks.length }} 个任务进行中</el-tag>
      </div>
      <div class="tasks-scroll">
        <div v-for="task in runningTasks" :key="task.id" class="task-chip">
          <div class="task-chip-left">
            <el-tag size="small" effect="dark">{{ task.task_date }}</el-tag>
            <el-tag size="small" :type="modeTagType(task.scene_mode)" effect="light">
              {{ modeLabel(task.scene_mode) }}
            </el-tag>
          </div>
          <div class="task-chip-progress">
            <el-progress
              :percentage="taskProgress(task)"
              :stroke-width="4"
              :show-text="false"
              :color="taskProgressColor(task)"
              style="width: 80px"
            />
            <span class="task-chip-progress-text">{{ taskProgressLabel(task) }}</span>
          </div>
          <div class="task-chip-stats">
            <span class="ts t-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {{ (task.total_sms || 0).toLocaleString() }}
            </span>
            <span class="ts t-danger">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
              {{ (task.spam_callers || 0).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useSmsStore } from '@/stores/sms'
import * as echarts from 'echarts'

const store = useSmsStore()

// ── Template refs ──
const smsTrendRef = ref(null)
const callerTrendRef = ref(null)
const categoryRef = ref(null)
const selectedDate = ref('')

// ── ECharts instances ──
let smsTrendChart = null
let callerTrendChart = null
let categoryChart = null

// ── Colors ──
const PRIMARY = '#6366f1'
const DANGER  = '#ef4444'
const WARNING = '#f59e0b'
const SUCCESS = '#10b981'

// ── Refresh ──
const onRefresh = async () => {
  await Promise.all([store.fetchOverview(), store.fetchTaskList({})])
  await nextTick()
  initSmsTrendChart()
  initCallerTrendChart()
  initCategoryChart()
}

// ── Date change (for category chart) ──
const onDateChange = async (val) => {
  if (!val) return
  await store.fetchTask(val)
  await nextTick()
  initCategoryChart()
}

// ── Computed: fraud rate display ──
const fraudRateDisplay = computed(() => {
  const r = store.overview?.fraud_sms_rate
  if (r == null) return '—'
  return parseFloat(r).toFixed(2) + '%'
})

// ── Computed: top10 from single-date task fraud_type_stats ──
const top10Data = computed(() => {
  const t = store.task
  if (!t || !Array.isArray(t.fraud_type_stats) || t.fraud_type_stats.length === 0) return []
  const total = t.total_sms || 1
  return [...t.fraud_type_stats]
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 10)
    .map(s => ({
      type:  s.type || '未分类',
      count: s.count || 0,
      rate:  Math.min(100, Math.round(((s.count || 0) / total) * 100)),
    }))
})

// ── Computed: running tasks ──
const runningTasks = computed(() =>
  (store.taskList || []).filter(t => t.status === 'running')
)

// ── Mode helpers ──
const modeLabel = (m) => ({
  rule_only: '规则判定',
  caller_llm: 'LLM号码研判',
  full_llm: '全流程LLM',
}[m] || m)

const modeTagType = (m) => ({
  rule_only: 'primary',
  caller_llm: 'warning',
  full_llm: 'danger',
}[m] || 'info')

// ── Task progress helpers ──
const taskProgress = (task) => {
  if (task.day_end_status === 'done') return 100
  if (task.nearline_status === 'done') return 80
  if (task.input_status === 'closed') return 55
  return 25
}

const taskProgressColor = (task) => {
  if (task.day_end_status === 'done') return SUCCESS
  if (task.nearline_status === 'done') return WARNING
  return PRIMARY
}

const taskProgressLabel = (task) => {
  if (task.day_end_status === 'done') return '已完成'
  if (task.nearline_status === 'done') return '日终分析'
  if (task.input_status === 'closed') return '近线研判'
  return '收集中'
}

// ── Rank badge class ──
const rankBadgeClass = (i) => ({ 0: 'rank-gold', 1: 'rank-silver', 2: 'rank-bronze' }[i] || 'rank-normal')

// ── Rank bar color ──
const rankBarColor = (rate) => rate >= 20 ? DANGER : rate >= 10 ? WARNING : PRIMARY

// ── Init SMS trend chart ──
const initSmsTrendChart = () => {
  if (!smsTrendRef.value) return
  if (smsTrendChart) { smsTrendChart.dispose(); smsTrendChart = null }

  const items = [...(store.overview?.items || [])].sort((a, b) =>
    (a.task_date || '').localeCompare(b.task_date || '')
  )
  const dates = items.map(it => it.task_date || '')
  const smsCounts = items.map(it => it.fraud_sms_count || 0)

  smsTrendChart = echarts.init(smsTrendRef.value)
  smsTrendChart.setOption({
    backgroundColor: '#ffffff',
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderWidth: 1, textStyle: { color: '#334155', fontSize: 12 } },
    grid: { top: 16, left: 60, right: 24, bottom: 48, containLabel: false },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11, rotate: 30 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    series: [{
      name: '涉诈短信',
      type: 'bar',
      data: smsCounts,
      barMaxWidth: 40,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#fca5a5' }]), borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', color: '#94a3b8', fontSize: 11, formatter: (p) => p.value > 0 ? p.value.toLocaleString() : '' },
    }],
  })
}

// ── Init Caller trend chart ──
const initCallerTrendChart = () => {
  if (!callerTrendRef.value) return
  if (callerTrendChart) { callerTrendChart.dispose(); callerTrendChart = null }

  const items = [...(store.overview?.items || [])].sort((a, b) =>
    (a.task_date || '').localeCompare(b.task_date || '')
  )
  const dates = items.map(it => it.task_date || '')
  const callerCounts = items.map(it => it.fraud_caller_count || 0)

  callerTrendChart = echarts.init(callerTrendRef.value)
  callerTrendChart.setOption({
    backgroundColor: '#ffffff',
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderWidth: 1, textStyle: { color: '#334155', fontSize: 12 } },
    grid: { top: 16, left: 60, right: 24, bottom: 48, containLabel: false },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 11, rotate: 30 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    series: [{
      name: '涉诈号码',
      type: 'bar',
      data: callerCounts,
      barMaxWidth: 40,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#fcd34d' }]), borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', color: '#94a3b8', fontSize: 11, formatter: (p) => p.value > 0 ? p.value.toLocaleString() : '' },
    }],
  })
}

// ── Init category bar chart ──
const initCategoryChart = () => {
  if (!categoryRef.value) return
  if (categoryChart) { categoryChart.dispose(); categoryChart = null }

  const stats = store.task?.fraud_type_stats || []
  const total = store.task?.total_sms || 1

  const topItems = [...stats]
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8)

  const labels = topItems.map(s => s.type || '未分类')
  const values = topItems.map(s => s.count || 0)
  const rates  = topItems.map(s => Math.min(100, ((s.count || 0) / total * 100).toFixed(1)))

  const PALETTE = [DANGER, WARNING, PRIMARY, SUCCESS, '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  categoryChart = echarts.init(categoryRef.value)

  const option = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 },
      formatter: (params) => {
        const p = params[0]
        const r = rates[params[0].dataIndex]
        return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
          <div>涉诈条数: <strong>${(p.value || 0).toLocaleString()}</strong></div>
          <div>占比: <strong>${r}%</strong></div>`
      },
    },
    grid: {
      top: 12,
      left: 12,
      right: 12,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 11 },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: PALETTE[i % PALETTE.length] },
            { offset: 1, color: PALETTE[i % PALETTE.length] + '99' },
          ]),
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 28,
      label: {
        show: true,
        position: 'right',
        formatter: '{c}',
        color: '#94a3b8',
        fontSize: 10,
      },
    }],
  }

  categoryChart.setOption(option)
}

// ── Resize handler ──
const handleResize = () => {
  if (smsTrendChart)    smsTrendChart.resize()
  if (callerTrendChart)  callerTrendChart.resize()
  if (categoryChart) categoryChart.resize()
}

// ── Lifecycle ──
onMounted(async () => {
  // Set default date to today
  const today = new Date()
  selectedDate.value = today.toISOString().slice(0, 10)

  await onRefresh()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (smsTrendChart)    { smsTrendChart.dispose();    smsTrendChart    = null }
  if (callerTrendChart)  { callerTrendChart.dispose();  callerTrendChart  = null }
  if (categoryChart) { categoryChart.dispose(); categoryChart = null }
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 24px;
  box-sizing: border-box;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

/* ── Header ── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-title h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 4px;
}

.header-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* ── Stats Row ── */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon-wrap {
  flex-shrink: 0;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-primary .stat-icon { background: linear-gradient(135deg, #6366f1, #818cf8); }
.stat-danger  .stat-icon { background: linear-gradient(135deg, #ef4444, #f87171); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.stat-success .stat-icon { background: linear-gradient(135deg, #10b981, #34d399); }

.stat-body { flex: 1; min-width: 0; }

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 30px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

/* ── Chart Section ── */
.chart-section,
.card-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-hint {
  font-size: 12px;
  color: #475569;
}

.chart-area {
  width: 100%;
}

.trend-chart {
  height: 300px;
}

.category-chart {
  height: 260px;
}

.date-picker-wrap :deep(.el-input__wrapper) {
  background: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: none;
}

/* ── TOP10 Table ── */
.top10-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 200px;
}

.top10-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s;
}

.top10-row:hover {
  border-color: #cbd5e1;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

.rank-gold   { background: linear-gradient(135deg, #f59e0b, #d97706); }
.rank-silver { background: linear-gradient(135deg, #94a3b8, #64748b); }
.rank-bronze { background: linear-gradient(135deg, #b45309, #92400e); }
.rank-normal { background: linear-gradient(135deg, #94a3b8, #64748b); }

.top10-type {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  min-width: 90px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top10-bar-wrap {
  flex: 1;
  min-width: 0;
}

.top10-bar-wrap :deep(.el-progress-bar__outer) {
  background: #f1f5f9;
}

.top10-count {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  min-width: 52px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: #475569;
  font-size: 14px;
}

/* ── Bottom row ── */
.bottom-row {
  margin-bottom: 20px;
}

/* ── Running Tasks ── */
.running-tasks-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

.pulse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
  70%  { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.tasks-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.task-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  flex-wrap: wrap;
}

.task-chip-left {
  display: flex;
  gap: 6px;
  align-items: center;
}

.task-chip-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-chip-progress-text {
  font-size: 11px;
  color: #64748b;
  min-width: 44px;
}

.task-chip-stats {
  display: flex;
  gap: 10px;
}

.ts {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.t-primary { color: #6366f1; }
.t-danger  { color: #ef4444; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .dashboard-page { padding: 12px; }
  .header-title h1 { font-size: 22px; }
  .stat-value { font-size: 22px; }
  .stat-card { padding: 14px 16px; gap: 12px; }
  .stat-icon { width: 44px; height: 44px; border-radius: 11px; }
  .trend-chart { height: 220px; }
  .category-chart { height: 220px; }
  .top10-type { max-width: 80px; }
}
</style>
