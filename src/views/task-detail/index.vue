<template>
  <div class="task-detail-page">
    <div class="page-header">
      <div class="header-left">
        <h2>任务详情</h2>
        <p class="page-desc">查看任务 {{ selectedDate }} 的详细短信数据</p>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">返回概览</el-button>
        <el-button type="primary" @click="refresh">刷新</el-button>
      </div>
    </div>

    <el-card shadow="hover" class="info-card" v-if="taskData.task_date">
      <div class="task-info-header">
        <div class="task-badges">
          <el-tag effect="plain" size="large">{{ taskData.task_date }}</el-tag>
          <el-tag size="small" :type="taskData.scene_mode === 'rule_only' ? 'primary' : 'warning'" effect="light">{{ getModeText(taskData.scene_mode) }}</el-tag>
          <el-tag :type="getStatusType(taskData.status)" size="small" round effect="dark">{{ getStatusText(taskData.status) }}</el-tag>
        </div>
        <div class="task-progress-inline">
          <span class="info-label">总进度：</span>
          <el-progress :percentage="taskProgress" :stroke-width="6" style="width:200px" :color="taskProgressColor" />
          <span class="progress-text">{{ taskProgressText }}</span>
        </div>
      </div>
      <div class="task-stages">
        <div class="stage-item" :class="{done: taskData.input_status === 'closed'}">
          <span class="stage-icon">1</span>
          <span class="stage-name">数据收集</span>
          <el-tag size="small" :type="taskData.input_status === 'closed' ? 'success' : 'info'">{{ taskData.input_status === 'closed' ? '已完成' : '进行中' }}</el-tag>
        </div>
        <div class="stage-arrow">→</div>
        <div class="stage-item" :class="{done: taskData.nearline_status === 'done'}">
          <span class="stage-icon">2</span>
          <span class="stage-name">近线研判</span>
          <el-tag size="small" :type="taskData.nearline_status === 'done' ? 'success' : 'info'">{{ taskData.nearline_status === 'done' ? '已完成' : '进行中' }}</el-tag>
        </div>
        <div class="stage-arrow">→</div>
        <div class="stage-item" :class="{done: taskData.day_end_status === 'done'}">
          <span class="stage-icon">3</span>
          <span class="stage-name">日终分析</span>
          <el-tag size="small" :type="taskData.day_end_status === 'done' ? 'success' : taskData.day_end_status === 'running' ? 'warning' : 'info'">{{ taskData.day_end_status === 'done' ? '已完成' : taskData.day_end_status === 'running' ? '进行中' : '等待' }}</el-tag>
        </div>
      </div>
    </el-card>
    <el-card shadow="hover" class="info-card" v-else-if="loading"><el-skeleton :rows="2" animated /></el-card>

    <el-row :gutter="24" class="progress-row" v-if="taskData.task_date">
      <el-col :xs="24" :lg="24">
        <el-card shadow="hover" class="progress-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时处理进度</span>
              <el-button size="small" link type="primary" @click="loadProgress" :loading="progressLoading">刷新</el-button>
            </div>
          </template>
          <div v-if="progressData" class="progress-content">
            <div class="progress-section flex-1">
              <div class="section-label">批次处理</div>
              <div class="progress-row-inner">
                <div class="progress-stat"><span class="ps-value">{{ progressData.batches.done }}</span><span class="ps-label">已完成</span></div>
                <el-progress :percentage="getBatchesProgress()" :stroke-width="10" style="flex:1" color="#6366f1" />
                <div class="progress-stat"><span class="ps-value">{{ progressData.batches.total }}</span><span class="ps-label">总批次</span></div>
              </div>
              <div class="batch-tags">
                <el-tag size="small" type="success" v-if="progressData.batches.done > 0">完成 {{ progressData.batches.done }}</el-tag>
                <el-tag size="small" type="danger" v-if="progressData.batches.failed > 0">失败 {{ progressData.batches.failed }}</el-tag>
                <el-tag size="small" type="info" v-if="progressData.batches.pending > 0">待处理 {{ progressData.batches.pending }}</el-tag>
              </div>
            </div>
            <div class="progress-section flex-1">
              <div class="section-label">短信记录处理</div>
              <div class="progress-row-inner">
                <div class="progress-stat"><span class="ps-value">{{ (progressData.records.processed||0).toLocaleString() }}</span><span class="ps-label">已处理</span></div>
                <el-progress :percentage="getRecordsProgress()" :stroke-width="10" style="flex:1" color="#10b981" />
                <div class="progress-stat"><span class="ps-value">{{ (progressData.records.total||0).toLocaleString() }}</span><span class="ps-label">总记录</span></div>
              </div>
            </div>
            <div class="progress-section flex-1" v-if="progressData.day_end">
              <div class="section-label">日终分析</div>
              <div class="progress-row-inner">
                <div class="progress-stat"><span class="ps-value">{{ progressData.day_end.detail || progressData.day_end.status }}</span><span class="ps-label">状态</span></div>
                <el-progress :percentage="progressData.day_end.progress||0" :stroke-width="10" style="flex:1" :color="progressData.day_end.status==='done'?'#10b981':progressData.day_end.status==='running'?'#f59e0b':'#94a3b8'" />
              </div>
              <div class="batch-tags" v-if="progressData.pipeline_stats">
                <el-tag size="small" type="info">发现号码: {{ progressData.pipeline_stats.callers }} 个</el-tag>
              </div>
            </div>
            <div class="recent-batches flex-2" v-if="progressData.recent_batches && progressData.recent_batches.length">
              <div class="section-label">最近批次</div>
              <div class="batch-list">
                <div v-for="b in progressData.recent_batches" :key="b.id" class="batch-item">
                  <el-tag size="small" :type="batchStatusType(b.status)" effect="plain">#{{ b.daily_batch_no }}</el-tag>
                  <span class="batch-info">{{ b.row_count }} 条</span>
                  <span class="batch-info" v-if="b.processing_elapsed_ms">{{ b.processing_elapsed_ms }}ms</span>
                  <span class="batch-error" v-if="b.error_message">{{ b.error_message.slice(0,80) }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-skeleton :rows="3" animated v-else-if="progressLoading" />
          <el-empty description="暂无进度数据" v-else />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="stats-row">
      <el-col :xs="12" :sm="6"><div class="stat-card blue"><div class="stat-icon"><el-icon :size="28"><Message /></el-icon></div><div class="stat-content"><div class="stat-label">短信总数</div><div class="stat-value">{{ (taskData.total_sms||0).toLocaleString() }}</div></div></div></el-col>
      <el-col :xs="12" :sm="6"><div class="stat-card red"><div class="stat-icon"><el-icon :size="28"><WarningFilled /></el-icon></div><div class="stat-content"><div class="stat-label">涉诈号码</div><div class="stat-value">{{ (taskData.spam_callers||0).toLocaleString() }}</div></div></div></el-col>
      <el-col :xs="12" :sm="6"><div class="stat-card purple"><div class="stat-icon"><el-icon :size="28"><User /></el-icon></div><div class="stat-content"><div class="stat-label">号码总数</div><div class="stat-value">{{ (taskData.total_callers||0).toLocaleString() }}</div></div></div></el-col>
      <el-col :xs="12" :sm="6"><div class="stat-card orange"><div class="stat-icon"><el-icon :size="28"><TrendCharts /></el-icon></div><div class="stat-content"><div class="stat-label">诈骗类型</div><div class="stat-value">{{ fraudTypeCount }}</div></div></div></el-col>
    </el-row>

    <el-card shadow="hover" class="table-card">
      <div class="table-toolbar">
        <span class="table-info">任务日期 {{ selectedDate }} 的号码研判数据</span>
        <el-button type="primary" @click="goToCallerAnalysis">查看号码研判</el-button>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">号码统计概览</span>
        </div>
      </template>
      <div class="caller-stats">
        <div class="caller-stat-item high">
          <div class="stat-num">{{ taskData.spam_callers || 0 }}</div>
          <div class="stat-label">涉诈号码</div>
        </div>
        <div class="caller-stat-item medium">
          <div class="stat-num">{{ taskData.uncertain_callers || 0 }}</div>
          <div class="stat-label">不确定号码</div>
        </div>
        <div class="caller-stat-item low">
          <div class="stat-num">{{ (taskData.total_callers || 0) - (taskData.spam_callers || 0) - (taskData.uncertain_callers || 0) }}</div>
          <div class="stat-label">正常号码</div>
        </div>
        <div class="caller-stat-item total">
          <div class="stat-num">{{ taskData.total_callers || 0 }}</div>
          <div class="stat-label">总号码数</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as smsApi from '@/api/sms'
import { ElMessage } from 'element-plus'
import { Message, WarningFilled, TrendCharts, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const selectedDate = ref(route.query.task_date || '')
const loading = ref(false)
const progressLoading = ref(false)
const llmLoading = ref(false)
const taskData = ref({})
const progressData = ref(null)
const llmData = ref(null)
let progressTimer = null

const fraudTypeCount = computed(() => taskData.value.fraud_type_stats ? taskData.value.fraud_type_stats.length : 0)

const taskProgress = computed(() => {
  const t = taskData.value
  if (!t || !t.status) return 0
  if (t.day_end_status === 'done') return 100
  if (t.nearline_status === 'done') return 90
  if (t.input_status === 'closed') return 60
  if (t.input_status === 'closing') return 30
  if (progressData.value && progressData.value.records && progressData.value.records.rate > 0) {
    const r = progressData.value.records.rate
    return r >= 100 ? 95 : Math.round(r * 0.5)
  }
  return 15
})

const taskProgressColor = computed(() => (taskData.value?.status === 'finished' || taskData.value?.status === 'completed' ? '#10b981' : '#6366f1'))

const getBatchesProgress = () => {
  const p = progressData.value
  if (!p || !p.batches || p.batches.total === 0) return 0
  return Math.round(p.batches.done / p.batches.total * 100)
}

const getRecordsProgress = () => {
  const p = progressData.value
  if (!p || !p.records || p.records.total === 0) return 0
  return Math.round(p.records.processed / p.records.total * 100)
}

const taskProgressText = computed(() => {
  const t = taskData.value
  const p = progressData.value

  if (!t) return '加载中...'

  if (t.status === 'completed' || t.day_end_status === 'done') return '已完成'
  if (t.status === 'failed') return '已失败'

  if (t.input_status === 'closed') {
    if (t.nearline_status === 'done') return '日终分析中'
    return '近线研判中'
  }

  if (t.input_status === 'closing') return '数据收集中 (关闭中)...'

  if (p && p.batches && p.batches.total > 0) {
    const percent = Math.round(p.batches.done / p.batches.total * 100)
    return `收集中 ${percent}% (${p.batches.done}/${p.batches.total} 批次)`
  }

  if (p && p.pipeline_stats && p.pipeline_stats.processed > 0) {
    return `处理中 ${p.pipeline_stats.processed.toLocaleString()} 条...`
  }

  return '等待数据导入...'
})

const getStatusType = s => ({ running:'warning', finished:'success', completed:'success', failed:'danger' }[s] || 'info')
const getStatusText = s => ({ running:'运行中', finished:'已完成', completed:'已完成', failed:'已停止' }[s] || s)
const getModeText = m => ({ rule_only:'规则判定', caller_llm:'LLM号码研判', full_llm:'全流程LLM' }[m] || m)
const batchStatusType = s => ({ done:'success', failed:'danger', processing:'warning', pending:'info' }[s] || 'info')
const formatTime = t => t ? new Date(t).toLocaleString('zh-CN') : '-'
const formatMs = ms => { if (!ms) return '0ms'; return ms < 1000 ? ms+'ms' : (ms/1000).toFixed(1)+'s' }

const goBack = () => router.push('/task-list')

const goToCallerAnalysis = () => {
  router.push({ path: '/sms-list', query: { task_date: selectedDate.value } })
}

const refresh = async () => {
  await Promise.all([loadTaskData(), loadProgress(), loadLlmSummary()])
}

const loadTaskData = async () => {
  if (!selectedDate.value) return
  loading.value = true
  try {
    const res = await smsApi.getTask(selectedDate.value)
    taskData.value = res.data || {}
  } catch(e) {
    console.error('loadTaskData error:', e)
    ElMessage.error(e && e.response && e.response.data && e.response.data.detail ? e.response.data.detail : '加载任务数据失败')
  }
  finally { loading.value = false }
}

const loadProgress = async () => {
  if (!selectedDate.value) return
  progressLoading.value = true
  try {
    const res = await smsApi.getTaskProgress(selectedDate.value)
    progressData.value = res.data
  } catch(e) { console.error('loadProgress error', e) }
  finally { progressLoading.value = false }
}

const loadLlmSummary = async () => {
  if (!selectedDate.value) return
  llmLoading.value = true
  try {
    const res = await smsApi.getLlmLogsSummary({ task_date: selectedDate.value })
    const items = res.data && res.data.items ? res.data.items : (res.data || [])
    const agg = { total:0, success:0, failed:0, tokens:0, elapsed_ms:0 }
    for (const item of items) {
      agg.total += item.total||0; agg.success += item.success||0; agg.failed += item.failed||0
      agg.tokens += item.total_tokens||0; agg.elapsed_ms += item.total_elapsed_ms||0
    }
    llmData.value = agg
  } catch(e) { console.error('loadLlmSummary error', e) }
  finally { llmLoading.value = false }
}

onMounted(async () => {
  if (!selectedDate.value) { ElMessage.warning('缺少任务日期参数'); router.push('/task-list'); return }
  await refresh()
  progressTimer = setInterval(() => {
    if (taskData.value && taskData.value.input_status !== 'closed' && taskData.value.nearline_status !== 'done') {
      loadProgress(); loadLlmSummary()
    }
  }, 10000)
})

onUnmounted(() => { if (progressTimer) clearInterval(progressTimer) })
</script>

<style scoped>
.task-detail-page { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-left h2 { margin: 0; font-size: 26px; font-weight: 700; }
.page-desc { margin-top: 6px; color: #64748b; font-size: 14px; }
.header-actions { display: flex; gap: 12px; }
.info-card { margin-bottom: 16px; }
.task-info-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
.task-badges { display: flex; gap: 10px; align-items: center; }
.task-progress-inline { display: flex; align-items: center; gap: 12px; }
.task-stages { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; }
.stage-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 20px; border-radius: 10px; background: #fff; min-width: 100px; transition: all 0.3s; }
.stage-item.done { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: #fff; }
.stage-item.done .stage-icon { background: #fff; color: #10b981; }
.stage-item.done .stage-name { color: #fff; }
.stage-item.done .el-tag { opacity: 0.9; }
.stage-icon { width: 28px; height: 28px; border-radius: 50%; background: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.stage-name { font-size: 13px; font-weight: 500; color: #475569; }
.stage-arrow { font-size: 20px; color: #cbd5e1; font-weight: 700; }
.task-info-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.task-info-detail { display: flex; gap: 24px; font-size: 13px; color: #64748b; }
.info-label { font-size: 13px; color: #64748b; }
.progress-text { font-size: 12px; color: #64748b; margin-left: 8px; }
.progress-row { margin-bottom: 24px; }
.progress-card { }
.progress-content { display: flex; flex-wrap: wrap; gap: 24px; }
.progress-section { flex: 1; min-width: 200px; }
.flex-1 { flex: 1; min-width: 220px; }
.flex-2 { flex: 2; min-width: 300px; }
.stat-card :deep(.el-card__header) { padding: 14px 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 14px; font-weight: 600; }
.progress-section { margin-bottom: 16px; }
.section-label { font-size: 12px; color: #64748b; margin-bottom: 8px; font-weight: 500; }
.progress-row-inner { display: flex; align-items: center; gap: 12px; }
.progress-stat { display: flex; flex-direction: column; align-items: center; min-width: 56px; }
.ps-value { font-size: 18px; font-weight: 700; }
.ps-label { font-size: 11px; color: #64748b; }
.batch-tags { display: flex; gap: 8px; margin-top: 8px; }
.recent-batches { margin-top: 16px; }
.batch-list { display: flex; flex-direction: column; gap: 6px; }
.batch-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f8fafc; border-radius: 6px; font-size: 12px; }
.batch-info { color: #64748b; }
.batch-error { color: #ef4444; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.llm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.llm-cell { display: flex; flex-direction: column; align-items: center; padding: 12px; background: #f8fafc; border-radius: 10px; }
.lc-val { font-size: 22px; font-weight: 700; }
.lc-label { font-size: 11px; color: #64748b; margin-top: 4px; }
.stats-row { margin-bottom: 24px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 16px; margin-bottom: 16px; border: none; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.stat-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-card.blue .stat-icon { background: linear-gradient(135deg,#6366f1,#818cf8); }
.stat-card.red .stat-icon { background: linear-gradient(135deg,#ef4444,#f87171); }
.stat-card.purple .stat-icon { background: linear-gradient(135deg,#8b5cf6,#a78bfa); }
.stat-card.orange .stat-icon { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.stat-content { flex: 1; }
.stat-label { font-size: 13px; color: #64748b; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 700; }
.table-card { margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
.table-info { font-size: 13px; color: #64748b; }
.caller-stats { display: flex; gap: 16px; flex-wrap: wrap; }
.caller-stat-item { flex: 1; min-width: 140px; display: flex; flex-direction: column; align-items: center; padding: 20px; border-radius: 12px; background: #f8fafc; }
.caller-stat-item.high { background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05)); }
.caller-stat-item.medium { background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05)); }
.caller-stat-item.low { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05)); }
.caller-stat-item.total { background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05)); }
.stat-num { font-size: 28px; font-weight: 700; color: #1e293b; }
.caller-stat-item.high .stat-num { color: #ef4444; }
.caller-stat-item.medium .stat-num { color: #f59e0b; }
.caller-stat-item.low .stat-num { color: #10b981; }
.caller-stat-item.total .stat-num { color: #6366f1; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 6px; }
</style>
