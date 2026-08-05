<template>
  <div class="task-list-page">
    <div class="page-header">
      <div class="header-left">
        <h2>任务管理</h2>
        <p class="page-desc">查看和管理所有分析任务</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">创建任务</el-button>
        <el-button @click="refresh">刷新</el-button>
      </div>
    </div>

    <el-card shadow="hover" class="table-card">
      <el-table :data="store.taskList" stripe v-loading="store.loading">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="task_date" label="任务日期" width="120">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.task_date }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" round>{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scene_mode" label="模式" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.scene_mode === 'rule_only' ? 'primary' : 'warning'" effect="light">
              {{ getModeText(row.scene_mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理进度" width="180">
          <template #default="{ row }">
            <div class="progress-wrap">
              <el-progress
                :percentage="getProgress(row)"
                :stroke-width="8"
                :show-text="false"
                :color="getProgressColor(row)"
                style="width: 100px"
              />
              <span class="progress-text">{{ getProgressText(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="total_sms" label="已处理" width="90" align="center">
          <template #default="{ row }">
            <span class="num-value">{{ (row.total_sms || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="spam_callers" label="涉诈" width="80" align="center">
          <template #default="{ row }">
            <span class="num-value danger">{{ row.spam_callers || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'running'" link type="danger" @click="stopTask(row)">停止</el-button>
            <el-button link type="success" @click="runTask(row)">
              {{ row.status === 'running' ? '重新运行' : '执行' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建任务" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="任务日期">
          <el-date-picker
            v-model="formData.task_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="运行模式">
          <el-select v-model="formData.mode" style="width: 100%">
            <el-option label="纯规则 (rule_only)" value="rule_only" />
            <el-option label="号码级LLM (caller_llm)" value="caller_llm" />
            <el-option label="全量LLM (full_llm)" value="full_llm" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doCreate">创建并运行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stopDialogVisible" title="停止任务" width="400px">
      <p>确定要停止任务 <strong>{{ stoppingTask?.task_date }}</strong> 吗？</p>
      <p class="warning-text">停止后需要手动清理未处理的数据。</p>
      <template #footer>
        <el-button @click="stopDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="doStop">确认停止</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import smsApi, { listTasks, createTask, finishTask } from '@/api/sms'

const router = useRouter()
const dialogVisible = ref(false)
const formData = reactive({ task_date: '', mode: 'rule_only' })
const submitting = ref(false)
const stopDialogVisible = ref(false)
const stoppingTask = ref(null)

const getStatusType = (s) => ({ running: 'warning', finished: 'success', completed: 'success', failed: 'danger' }[s] || 'info')
const getStatusText = (s) => ({ running: '运行中', finished: '已完成', completed: '已完成', failed: '已失败' }[s] || s)
const getModeText = (m) => ({ rule_only: '规则判定', caller_llm: 'LLM号码研判', full_llm: '全流程LLM' }[m] || m)
const getProgress = (row) => {
  if (row.status === 'finished' || row.status === 'completed') return 100
  if (row.status === 'failed') return 0
  if (row.status === 'running') {
    if (row.input_status === 'closed' && row.nearline_status === 'done' && row.day_end_status === 'done') return 100
    if (row.input_status === 'closed' && row.nearline_status === 'done') return 90
    if (row.input_status === 'closed') return 60
    if (row.input_status === 'closing') return 30
    return 15
  }
  return 0
}
const getProgressColor = (row) => {
  if (row.status === 'failed') return '#ef4444'
  if (row.status === 'finished' || row.status === 'completed') return '#10b981'
  return '#6366f1'
}
const getProgressText = (row) => {
  if (row.status === 'failed') return '已失败'
  if (row.status === 'finished' || row.status === 'completed') return '已完成'
  if (row.status === 'running') {
    if (row.input_status === 'closed' && row.nearline_status === 'done' && row.day_end_status === 'done') return '完成'
    if (row.input_status === 'closed' && row.nearline_status === 'done') return '日终分析'
    if (row.input_status === 'closed') return '近线研判'
    if (row.input_status === 'closing') return '关闭数据'
    // 数据收集中 - 显示百分比
    const pct = getProgress(row)
    return pct + '%'
  }
  return '未知'
}
const viewDetail = (row) => {
  router.push({ path: '/task-detail', query: { task_date: row.task_date, mode: row.scene_mode } })
}
const stopTask = (row) => {
  stoppingTask.value = row
  stopDialogVisible.value = true
}
const doStop = async () => {
  stopDialogVisible.value = false
  try {
    await finishTask(stoppingTask.value.task_date, stoppingTask.value.scene_mode)
    ElMessage.success('任务已停止')
    refresh()
  } catch (e) {
    ElMessage.error('停止任务失败')
  }
}
const runTask = async (row) => {
  try {
    await createTask(row.task_date, row.scene_mode)
    ElMessage.success('任务已开始运行')
    refresh()
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '启动任务失败')
  }
}
const showCreateDialog = () => {
  formData.task_date = ''
  formData.mode = 'rule_only'
  dialogVisible.value = true
}
const doCreate = async () => {
  if (!formData.task_date) {
    ElMessage.warning('请选择任务日期')
    return
  }
  // 立即关闭对话框
  dialogVisible.value = false
  submitting.value = true

  // 后台启动任务，不等待完成
  createTask(formData.task_date, formData.mode)
    .then(() => {
      ElMessage.success('任务已创建，开始处理...')
      // 跳转到详情页
      router.push({ path: '/task-detail', query: { task_date: formData.task_date, mode: formData.mode } })
    })
    .catch((e) => {
      ElMessage.error(e.response?.data?.detail || '创建任务失败')
    })
    .finally(() => {
      submitting.value = false
    })
}
const refresh = async () => {
  await listTasks().then(res => {
    store.taskList = res.data
  }).catch(() => {})
}

const store = reactive({ taskList: [], loading: false })
let refreshInterval = null
onMounted(() => {
  refresh()
  refreshInterval = setInterval(refresh, 10000)
})
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.task-list-page { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h2 { margin: 0; font-size: 36px; font-weight: 900; letter-spacing: 2px; background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.page-desc { margin-top: 8px; color: #475569; font-size: 16px; letter-spacing: 0.5px; }
.table-card { margin-bottom: 16px; }
.progress-wrap { display: flex; align-items: center; gap: 10px; }
.progress-text { font-size: 12px; color: #666; min-width: 60px; }
.num-value { font-weight: 600; font-family: monospace; }
.num-value.danger { color: #ef4444; }
.warning-text { color: #ef4444; font-size: 13px; margin-top: 8px; }
</style>
