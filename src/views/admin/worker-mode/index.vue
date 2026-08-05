<template>
  <div class="worker-mode-page">
    <div class="page-header">
      <h3>Worker 运行模式</h3>
      <p class="desc">选择系统运行模式，不同模式会影响短信和号码的判定方式</p>
    </div>

    <el-row :gutter="24" class="mode-cards">
      <el-col :xs="24" :sm="8">
        <div class="mode-card" :class="{ active: selectedMode === 'rule_only' }" @click="selectMode('rule_only')">
          <div class="mode-badge">快速测试</div>
          <h4>纯规则判定</h4>
          <p class="mode-name">rule_only</p>
          <ul>
            <li>SMS使用规则引擎</li>
            <li>Caller使用规则引擎</li>
            <li>无LLM调用</li>
            <li>速度快，成本低</li>
          </ul>
          <el-tag v-if="currentMode === 'rule_only'" type="success" size="small">当前模式</el-tag>
          <el-tag v-else size="small">选择</el-tag>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="mode-card recommended" :class="{ active: selectedMode === 'caller_llm' }" @click="selectMode('caller_llm')">
          <div class="mode-badge recommend">推荐生产</div>
          <h4>LLM号码研判</h4>
          <p class="mode-name">caller_llm</p>
          <ul>
            <li>SMS使用规则引擎</li>
            <li>Caller使用LLM深度研判</li>
            <li>仅Caller调用LLM</li>
            <li>成本适中，准确率高</li>
          </ul>
          <el-tag v-if="currentMode === 'caller_llm'" type="success" size="small">当前模式</el-tag>
          <el-tag v-else type="warning" size="small">选择</el-tag>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="mode-card" :class="{ active: selectedMode === 'full_llm' }" @click="selectMode('full_llm')">
          <div class="mode-badge">实验性</div>
          <h4>全流程LLM</h4>
          <p class="mode-name">full_llm</p>
          <ul>
            <li>SMS使用LLM判定</li>
            <li>Caller使用LLM研判</li>
            <li>SMS和Caller都调用LLM</li>
            <li>成本最高</li>
          </ul>
          <el-tag v-if="currentMode === 'full_llm'" type="success" size="small">当前模式</el-tag>
          <el-tag v-else size="small">选择</el-tag>
        </div>
      </el-col>
    </el-row>

    <!-- 自动执行开关 -->
    <el-card shadow="hover" class="auto-run-card">
      <template #header>
        <div class="auto-run-header">
          <span>自动执行控制</span>
          <el-switch
            v-model="autoRun"
            :loading="saving"
            @change="toggleAutoRun"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </template>
      <div class="auto-run-info">
        <p v-if="autoRun" class="auto-run-on">
          <el-icon color="#10b981"><CircleCheckFilled /></el-icon>
          自动执行已开启。系统会自动从 <code>data/</code> 目录读取CSV文件，导入数据并进行分析处理。
        </p>
        <p v-else class="auto-run-off">
          <el-icon color="#f59e0b"><WarningFilled /></el-icon>
          自动执行已关闭。需要手动在"任务管理"页面创建任务来处理数据。
        </p>
        <p class="auto-run-hint">
          注意：开启自动执行后，服务器会持续监控 data 目录下的CSV文件，自动导入并处理。
        </p>
      </div>
    </el-card>

    <div v-if="hasChanges" class="confirm-section">
      <el-button type="primary" :loading="saving" @click="confirmMode">保存设置</el-button>
    </div>

    <div v-if="selectedMode && (selectedMode === 'caller_llm' || selectedMode === 'full_llm')" class="llm-info">
      <h4>LLM 调用说明</h4>
      <el-card shadow="hover">
        <template #header>
          <span>LLM 调用方案对比</span>
        </template>
        <el-table :data="llmComparison" stripe>
          <el-table-column prop="mode" label="模式" />
          <el-table-column prop="sms" label="SMS研判" />
          <el-table-column prop="caller" label="Caller研判" />
          <el-table-column prop="cost" label="成本" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { workerModeApi } from '@/api/worker_mode'

const currentMode = ref('')
const selectedMode = ref('')
const autoRun = ref(true)
const saving = ref(false)

const hasChanges = computed(() => {
  return selectedMode.value !== currentMode.value || autoRun.value !== false
})

const llmComparison = [
  { mode: 'rule_only', sms: '规则引擎', caller: '规则引擎', cost: '无LLM成本' },
  { mode: 'caller_llm', sms: '规则引擎', caller: 'LLM深度分析', cost: '仅Caller调用' },
  { mode: 'full_llm', sms: 'LLM判定', caller: 'LLM研判', cost: 'SMS+Caller全调用' }
]

const getModeText = (m) => ({ rule_only: '纯规则判定', caller_llm: 'LLM号码研判', full_llm: '全流程LLM' }[m] || m)

const selectMode = (mode) => {
  selectedMode.value = mode
}

const toggleAutoRun = async (value) => {
  saving.value = true
  try {
    await workerModeApi.update(selectedMode.value, value)
    ElMessage.success(`自动执行已${value ? '开启' : '关闭'}`)
  } catch (e) {
    autoRun.value = !value
    ElMessage.error('设置失败')
  } finally {
    saving.value = false
  }
}

const confirmMode = async () => {
  saving.value = true
  try {
    await workerModeApi.update(selectedMode.value, autoRun.value)
    currentMode.value = selectedMode.value
    ElMessage.success('设置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await workerModeApi.getCurrent()
    currentMode.value = res.data.mode
    selectedMode.value = res.data.mode
    autoRun.value = res.data.auto_run || false
  } catch (e) {
    console.error('Failed to load mode', e)
  }
})
</script>

<style scoped>
.worker-mode-page { }
.page-header { margin-bottom: 24px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.desc { color: var(--text-secondary); font-size: 14px; margin: 0; }

.mode-cards { margin-bottom: 24px; }
.mode-card {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
  height: 100%;
}
.mode-card:hover { border-color: #6366f1; transform: translateY(-4px); }
.mode-card.active { border-color: #6366f1; background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.02)); }
.mode-card.recommended { border-color: #10b981; }
.mode-card.recommended.active { border-color: #10b981; }

.mode-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #f1f5f9;
  color: #64748b;
  margin-bottom: 12px;
}
.mode-badge.recommend { background: linear-gradient(135deg, #10b981, #34d399); color: #fff; }

.mode-card h4 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
.mode-name { font-size: 13px; color: #94a3b8; margin: 0 0 16px; font-family: monospace; }

.mode-card ul {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-secondary);
}
.mode-card ul li { padding: 4px 0; }

.auto-run-card { margin-bottom: 24px; }
.auto-run-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.auto-run-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
}
.auto-run-on { color: #10b981; }
.auto-run-off { color: #f59e0b; }
.auto-run-hint { color: var(--text-secondary); font-size: 13px; margin: 16px 0 0; }
.auto-run-info code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.confirm-section { text-align: center; margin-bottom: 32px; }

.llm-info h4 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
</style>
