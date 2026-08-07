<template>
  <div class="sms-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>号码研判</h2>
        <p class="page-desc">按号码维度查看涉诈短信判定结果</p>
      </div>
    </div>

    <!-- Filter Card -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-date-picker
          v-model="filters.date"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="onDateChange"
          class="filter-input"
        />
        <el-select v-model="filters.riskLevel" placeholder="风险等级" clearable style="width: 120px" @change="onRiskLevelChange">
          <el-option label="高风险" value="high" />
          <el-option label="中风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
        <el-select v-model="filters.label" placeholder="标签" clearable style="width: 140px" @change="onLabelChange">
          <el-option label="涉诈发送者" value="spam_sender" />
          <el-option label="正常发送者" value="normal_sender" />
          <el-option label="不确定" value="uncertain" />
        </el-select>
        <el-select v-model="filters.category" placeholder="分类" clearable style="width: 160px">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="filters.method" placeholder="判定方式" clearable style="width: 120px">
          <el-option label="LLM" value="llm" />
          <el-option label="规则" value="rule" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- Stats -->
    <el-card shadow="hover" class="stats-card">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">总数</span>
          <span class="stat-value">{{ totalCount }}</span>
        </div>
        <div class="stat-item high">
          <span class="stat-label">高风险</span>
          <span class="stat-value">{{ store.callerStats.high_risk }}</span>
        </div>
        <div class="stat-item medium">
          <span class="stat-label">中风险</span>
          <span class="stat-value">{{ store.callerStats.medium_risk }}</span>
        </div>
        <div class="stat-item low">
          <span class="stat-label">低风险</span>
          <span class="stat-value">{{ store.callerStats.low_risk }}</span>
        </div>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="hover" class="table-card">
      <div class="table-toolbar">
        <span class="table-info">共 {{ totalCount }} 条</span>
        <div class="sort-buttons">
          <el-button
            v-for="item in sortOptions"
            :key="item.value"
            :type="sortOrder === item.value ? 'primary' : ''"
            size="small"
            @click="toggleSort(item.value)"
          >
            {{ item.label }}{{ sortOrder === item.value ? (sortDir === 'desc' ? '↓' : '↑') : '' }}
          </el-button>
        </div>
      </div>
      <el-table :data="paginatedData" stripe v-loading="store.loading" :row-class-name="rowClassName">
        <el-table-column type="index" label="#" width="60" align="center">
          <template #default="{ $index }">{{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="caller" label="号码" width="150">
          <template #default="{ row }"><span class="phone-num">{{ row.caller }}</span></template>
        </el-table-column>
        <el-table-column label="风险" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskType(row.label)" effect="dark" round>{{ getRiskText(row.label) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getLabelTagType(row.label)" size="small" round>{{ getLabelText(row.label) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="140">
          <template #default="{ row }">
            <span v-if="row.category" class="category-tag">{{ row.category }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="130" align="center">
          <template #default="{ row }">
            <div class="confidence-wrap">
              <el-progress :percentage="Math.round((row.confidence || 0) * 100)" :stroke-width="6" :show-text="false" :color="getConfidenceColor(row.confidence)" style="width: 60px" />
              <span class="conf-text">{{ ((row.confidence || 0) * 100).toFixed(0) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="judged_sms_total" label="短信数" width="80" align="center">
          <template #default="{ row }"><span class="sms-count">{{ row.judged_sms_total || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="method" label="方式" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.method === 'llm' ? 'warning' : 'primary'" round>{{ row.method === 'llm' ? 'LLM' : '规则' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="判定原因" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="!authStore.isAdmin" @click="viewCallerDetail(row)">详情</el-button>
            <el-button link type="primary" :disabled="!authStore.isAdmin" @click="viewMessages(row)">短信</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="totalCount"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- Caller Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="'号码详情 - ' + currentCaller" width="700px">
      <el-descriptions v-if="callerDetail" :column="2" border>
        <el-descriptions-item label="号码">{{ callerDetail.caller }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :type="getRiskType(callerDetail.label)" effect="dark" round>{{ getRiskText(callerDetail.label) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          <el-tag :type="getLabelTagType(callerDetail.label)" size="small" round>{{ getLabelText(callerDetail.label) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="判定方式">{{ callerDetail.method === 'llm' ? 'LLM' : '规则' }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ callerDetail.category || '-' }}</el-descriptions-item>
        <el-descriptions-item label="短信数量">{{ callerDetail.judged_sms_total || '-' }}</el-descriptions-item>
        <el-descriptions-item label="置信度" :span="2">
          <el-progress :percentage="Math.round((callerDetail.confidence || 0) * 100)" :color="getConfidenceColor(callerDetail.confidence)" />
        </el-descriptions-item>
        <el-descriptions-item label="判定原因" :span="2">{{ callerDetail.reason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="callerDetail?.evidence" class="evidence-section">
        <div class="evidence-title">证据信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="URL">{{ formatEvidence(callerDetail.evidence.entity_summary?.urls) }}</el-descriptions-item>
          <el-descriptions-item label="黑名单命中">{{ formatEvidence(callerDetail.evidence.entity_summary?.blacklist_hits) }}</el-descriptions-item>
          <el-descriptions-item label="关键词">{{ formatEvidence(callerDetail.evidence.keyword_summary) }}</el-descriptions-item>
          <el-descriptions-item label="内容电话">{{ formatEvidence(callerDetail.evidence.entity_summary?.phones_in_content) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- Messages Dialog -->
    <el-dialog v-model="messagesVisible" :title="'短信记录 - ' + currentCaller" width="85%">
      <el-table :data="callerMessages" stripe v-loading="msgLoading">
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="caller" label="发送方" width="130" />
        <el-table-column prop="callee" label="接收方" width="130" />
        <el-table-column prop="content" label="短信内容" min-width="250" show-overflow-tooltip />
        <el-table-column label="接收时间" width="160">
          <template #default="{ row }">{{ formatTime(row.receive_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="viewMessageDetail(row.id)">详情</el-button></template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="msgPagination.page"
          v-model:page-size="msgPagination.pageSize"
          :total="msgTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadMessages"
          @current-change="loadMessages"
        />
      </div>
    </el-dialog>

    <!-- Message Detail Dialog -->
    <el-dialog v-model="msgDetailVisible" title="短信详情" width="600px">
      <el-descriptions v-if="currentMessage" :column="1" border>
        <el-descriptions-item label="发送号码">{{ currentMessage.caller }}</el-descriptions-item>
        <el-descriptions-item label="接收号码">{{ currentMessage.callee || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接收时间">{{ formatTime(currentMessage.receive_time) }}</el-descriptions-item>
        <el-descriptions-item label="标签">{{ currentMessage.sms_label }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentMessage.sms_category }}</el-descriptions-item>
        <el-descriptions-item label="短信内容">{{ currentMessage.content }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSmsStore } from '@/stores/sms'
import { useAuthStore } from '@/stores/auth'
import { formatTime } from '@/utils/format'
import { ElMessage } from 'element-plus'

const store = useSmsStore()
const authStore = useAuthStore()
const route = useRoute()
const detailVisible = ref(false)
const messagesVisible = ref(false)
const msgDetailVisible = ref(false)
const currentCaller = ref('')
const callerDetail = ref(null)
const callerMessages = ref([])
const msgTotal = ref(0)
const currentMessage = ref(null)
const msgLoading = ref(false)

const filters = reactive({ date: route.query.task_date || '2026-06-01', riskLevel: '', label: '', category: '', method: '' })
const pagination = reactive({ page: 1, pageSize: 20 })
const msgPagination = reactive({ page: 1, pageSize: 20 })

const categoryOptions = ['色情低俗', '赌博博彩', '非法服务与违禁品', '广告营销', '诱导加好友/引流', '仿冒身份', '利益诱导', '情感交友诱导', '威胁恐吓', '骚扰催收', '辱骂攻击', '正常信息']

const riskMap = { high: 'spam_sender', medium: 'uncertain', low: 'normal_sender' }

const sortOrder = ref('risk')
const sortDir = ref('desc')
const sortOptions = [
  { label: '按风险', value: 'risk' },
  { label: '按置信度', value: 'confidence' },
  { label: '按短信数', value: 'count' }
]

const displayData = computed(() => {
  return store.callers || []
})

// 后端已分页，前端不再切片
const paginatedData = computed(() => {
  return displayData.value
})

const totalCount = computed(() => store.total || displayData.value.length)

const getRiskText = (l) => ({ spam_sender: '高风险', uncertain: '中风险', normal_sender: '低风险' }[l] || '未知')
const getRiskType = (l) => ({ spam_sender: 'danger', uncertain: 'warning', normal_sender: 'success' }[l] || 'info')
const getLabelText = (l) => ({ spam_sender: '涉诈', uncertain: '不确定', normal_sender: '正常' }[l] || l || '-')
const getLabelTagType = (l) => ({ spam_sender: 'danger', uncertain: 'warning', normal_sender: 'success' }[l] || 'info')
const getConfidenceColor = (v) => ((v || 0) * 100 >= 80 ? '#10b981' : (v || 0) * 100 >= 50 ? '#f59e0b' : '#ef4444')

const rowClassName = ({ row }) => row.label === 'spam_sender' ? 'risk-high-row' : row.label === 'uncertain' ? 'risk-medium-row' : ''

const formatEvidence = (v) => Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : v || '-'

const onRiskLevelChange = () => { filters.label = ''; handleSearch() }
const onLabelChange = () => { filters.riskLevel = ''; handleSearch() }
const onDateChange = () => { pagination.page = 1; handleSearch() }
const onSizeChange = () => { pagination.page = 1; handleSearch() }
const onPageChange = () => { handleSearch() }

const toggleSort = (type) => {
  if (sortOrder.value === type) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortOrder.value = type
    sortDir.value = 'desc'
  }
  pagination.page = 1
  handleSearch()
}

onMounted(() => handleSearch())

const handleSearch = () => {
  let label = filters.label || undefined
  if (filters.riskLevel && !filters.label) label = riskMap[filters.riskLevel]
  const offset = (pagination.page - 1) * pagination.pageSize
  store.fetchCallers({
    task_date: filters.date,
    label,
    category: filters.category || undefined,
    method: filters.method || undefined,
    sort_by: sortOrder.value,
    sort_order: sortDir.value,
    limit: pagination.pageSize,
    offset
  })
}

const handleReset = () => {
  filters.riskLevel = ''
  filters.label = ''
  filters.category = ''
  filters.method = ''
  pagination.page = 1
  handleSearch()
}

const viewCallerDetail = async (row) => { currentCaller.value = row.caller; detailVisible.value = true; await store.fetchCallerDetail(row.caller, { task_date: filters.date }); callerDetail.value = store.callerDetail }

const viewMessages = async (row) => { currentCaller.value = row.caller; messagesVisible.value = true; msgPagination.page = 1; msgTotal.value = 0; await loadMessages() }

const loadMessages = async () => { msgLoading.value = true; try { await store.fetchCallerMessages(currentCaller.value, { task_date: filters.date, page: msgPagination.page, page_size: msgPagination.pageSize }); callerMessages.value = store.callerMessages; msgTotal.value = store.total || callerMessages.value.length } finally { msgLoading.value = false } }

const viewMessageDetail = async (smsId) => { msgDetailVisible.value = true; currentMessage.value = await store.getMessage(smsId) }
</script>

<style scoped>
.sms-list-page { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 36px; font-weight: 900; color: var(--text-primary); letter-spacing: 2px; background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.page-desc { margin-top: 8px; color: var(--text-secondary); font-size: 16px; letter-spacing: 0.5px; }

.filter-card { margin-bottom: 16px; }
.filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.filter-input { width: 150px; }

.stats-card { margin-bottom: 16px; }
.stats-row { display: flex; gap: 16px; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; background: #f8fafc; }
.stat-item.high { background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05)); }
.stat-item.medium { background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05)); }
.stat-item.low { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05)); }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 30px; font-weight: 800; color: var(--text-primary); letter-spacing: 1px; }
.stat-item.high .stat-value { color: #ef4444; }
.stat-item.medium .stat-value { color: #f59e0b; }
.stat-item.low .stat-value { color: #10b981; }

.table-card { margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-light); }
.table-info { font-size: 13px; color: var(--text-secondary); }
.risk-high-row { background: rgba(239, 68, 68, 0.06) !important; }
.risk-medium-row { background: rgba(245, 158, 11, 0.05) !important; }
.phone-num { font-family: monospace; font-weight: 600; font-size: 13px; color: var(--primary); background: var(--primary-subtle); padding: 4px 8px; border-radius: 6px; }
.category-tag { font-size: 12px; color: var(--text-regular); background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
.text-muted { color: var(--text-secondary); }
.confidence-wrap { display: flex; align-items: center; gap: 8px; }
.conf-text { font-size: 12px; font-weight: 600; color: var(--text-regular); min-width: 36px; }
.sms-count { font-weight: 600; color: var(--text-primary); font-family: monospace; }
.pagination { display: flex; justify-content: flex-end; padding: 16px 20px; background: #fafbfc; border-top: 1px solid var(--border-light); }

.evidence-section { margin-top: 20px; }
.evidence-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
</style>
