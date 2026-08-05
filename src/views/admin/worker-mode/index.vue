<template>
  <div class="worker-mode-page">
    <div class="page-header">
      <h3>Worker 运行模式</h3>
      <p class="desc">选择系统运行模式，不同模式会影响短信和号码的判定方式。保存后立即生效，无需重启。</p>
    </div>

    <el-row :gutter="24" class="mode-cards">
      <el-col :xs="24" :sm="8">
        <div
          class="mode-card"
          :class="{ active: selectedMode === 'rule_only' }"
          @click="selectMode('rule_only')"
        >
          <div class="mode-badge">快速测试</div>
          <h4>纯规则判定</h4>
          <p class="mode-name">rule_only</p>
          <ul>
            <li>SMS使用规则引擎</li>
            <li>Caller使用规则引擎</li>
            <li>无LLM调用</li>
            <li>速度快，成本低</li>
          </ul>
          <div class="mode-status">
            <el-tag v-if="currentMode === 'rule_only'" type="success" size="small" effect="plain">
              <el-icon><Check /></el-icon> 已选中
            </el-tag>
            <el-tag v-else size="small" effect="plain">点击选择</el-tag>
          </div>
          <div v-if="selectedMode === 'rule_only'" class="selected-indicator">
            <el-icon class="check-icon"><Check /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="8">
        <div
          class="mode-card recommended"
          :class="{ active: selectedMode === 'caller_llm' }"
          @click="selectMode('caller_llm')"
        >
          <div class="mode-badge recommend">推荐生产</div>
          <h4>LLM号码研判</h4>
          <p class="mode-name">caller_llm</p>
          <ul>
            <li>SMS使用规则引擎</li>
            <li>Caller使用LLM深度研判</li>
            <li>仅Caller调用LLM</li>
            <li>成本适中，准确率高</li>
          </ul>
          <div class="mode-status">
            <el-tag v-if="currentMode === 'caller_llm'" type="success" size="small" effect="plain">
              <el-icon><Check /></el-icon> 已选中
            </el-tag>
            <el-tag v-else type="warning" size="small" effect="plain">点击选择</el-tag>
          </div>
          <div v-if="selectedMode === 'caller_llm'" class="selected-indicator">
            <el-icon class="check-icon"><Check /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="8">
        <div
          class="mode-card"
          :class="{ active: selectedMode === 'full_llm' }"
          @click="selectMode('full_llm')"
        >
          <div class="mode-badge">实验性</div>
          <h4>全流程LLM</h4>
          <p class="mode-name">full_llm</p>
          <ul>
            <li>SMS使用LLM判定</li>
            <li>Caller使用LLM研判</li>
            <li>SMS和Caller都调用LLM</li>
            <li>成本最高</li>
          </ul>
          <div class="mode-status">
            <el-tag v-if="currentMode === 'full_llm'" type="success" size="small" effect="plain">
              <el-icon><Check /></el-icon> 已选中
            </el-tag>
            <el-tag v-else size="small" effect="plain">点击选择</el-tag>
          </div>
          <div v-if="selectedMode === 'full_llm'" class="selected-indicator">
            <el-icon class="check-icon"><Check /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 自动执行开关 -->
    <el-card shadow="hover" class="auto-run-card">
      <template #header>
        <div class="auto-run-header">
          <div class="header-left">
            <span class="header-title">自动执行</span>
            <el-tooltip content="开启后，Worker 会持续监控数据库中的待处理批次，自动执行研判任务">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch
            v-model="autoRun"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </template>
      <div class="auto-run-info">
        <p v-if="autoRun" class="auto-run-on">
          <el-icon color="#10b981"><CircleCheckFilled /></el-icon>
          自动执行已开启。系统会自动处理待处理的批次数据。
        </p>
        <p v-else class="auto-run-off">
          <el-icon color="#f59e0b"><WarningFilled /></el-icon>
          自动执行已关闭。需要手动触发任务处理。
        </p>
      </div>
    </el-card>

    <!-- 保存按钮 -->
    <div class="confirm-section">
      <el-button
        type="primary"
        size="large"
        :loading="saving"
        :disabled="!hasChanges"
        @click="confirmMode"
      >
        <el-icon v-if="hasChanges"><Position /></el-icon>
        {{ hasChanges ? '保存设置' : '当前配置已保存' }}
      </el-button>
      <span v-if="savedTime" class="saved-time">上次保存: {{ savedTime }}</span>
    </div>

    <!-- LLM 说明 -->
    <div v-if="selectedMode && (selectedMode === 'caller_llm' || selectedMode === 'full_llm')" class="llm-info">
      <h4>LLM 调用说明</h4>
      <el-table :data="llmComparison" stripe>
        <el-table-column prop="mode" label="模式" width="120" />
        <el-table-column prop="sms" label="SMS研判" />
        <el-table-column prop="caller" label="Caller研判" />
        <el-table-column prop="cost" label="成本" width="150" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Position, QuestionFilled } from '@element-plus/icons-vue'
import { workerModeApi } from '@/api/worker_mode'

const currentMode = ref('')
const selectedMode = ref('')
const autoRun = ref(false)
const saving = ref(false)
const savedTime = ref('')

// 判断是否有未保存的变更
const hasChanges = computed(() => {
  return selectedMode.value !== currentMode.value || autoRun.value !== (currentMode.value === 'caller_llm' ? true : false)
})

const llmComparison = [
  { mode: 'rule_only', sms: '规则引擎', caller: '规则引擎', cost: '无LLM成本' },
  { mode: 'caller_llm', sms: '规则引擎', caller: 'LLM深度分析', cost: '仅Caller调用' },
  { mode: 'full_llm', sms: 'LLM判定', caller: 'LLM研判', cost: 'SMS+Caller全调用' }
]

const selectMode = (mode) => {
  selectedMode.value = mode
}

const confirmMode = async () => {
  if (!selectedMode.value) return
  saving.value = true
  try {
    await workerModeApi.update(selectedMode.value, autoRun.value)
    currentMode.value = selectedMode.value
    savedTime.value = new Date().toLocaleTimeString('zh-CN')
    ElMessage.success('设置已保存，Worker 将在下一个批次处理时自动应用新配置')
  } catch (e) {
    ElMessage.error('保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await workerModeApi.getCurrent()
    currentMode.value = res.data.mode || 'caller_llm'
    selectedMode.value = currentMode.value
    autoRun.value = res.data.auto_run ?? true  // 默认开启
  } catch (e) {
    console.error('Failed to load mode', e)
  }
})
</script>

<style scoped>
.worker-mode-page { padding: 0 8px; }

.page-header { margin-bottom: 24px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.desc { color: var(--text-secondary); font-size: 14px; margin: 0; }

.mode-cards { margin-bottom: 24px; }

.mode-card {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  height: 100%;
  min-height: 280px;
  position: relative;
  overflow: hidden;
}
.mode-card:hover {
  border-color: #6366f1;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
}
.mode-card.active {
  border-color: #6366f1;
  border-width: 3px;
  background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02));
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
}
.mode-card.recommended { border-color: #10b981; }
.mode-card.recommended:hover { border-color: #10b981; }
.mode-card.recommended.active {
  border-color: #10b981;
  border-width: 3px;
  background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02));
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
}

/* 选中角标 */
.selected-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 6px 6px 0 0;
}
.mode-card.recommended .selected-indicator {
  background: linear-gradient(135deg, #10b981, #34d399);
}
.check-icon {
  font-size: 18px;
  color: #fff;
}

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
  color: var(--text-secondary, #64748b);
}
.mode-card ul li { padding: 4px 0; }

.mode-status { margin-top: auto; }

/* 自动执行 */
.auto-run-card { margin-bottom: 24px; }
.auto-run-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-title { font-weight: 600; }
.help-icon { color: #94a3b8; cursor: help; }
.auto-run-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
}
.auto-run-on { color: #10b981; }
.auto-run-off { color: #f59e0b; }

/* 保存按钮 */
.confirm-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.saved-time {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}

/* LLM 说明 */
.llm-info h4 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
</style>
