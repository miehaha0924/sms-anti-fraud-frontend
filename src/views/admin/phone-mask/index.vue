<template>
  <div class="phone-mask-page">
    <div class="page-header">
      <h3>电话号码屏蔽规则</h3>
      <p class="desc">设置普通用户可见的电话号码屏蔽规则</p>
    </div>

    <el-card shadow="hover" class="preview-card">
      <template #header>
        <span>预览效果</span>
      </template>
      <div class="preview-row">
        <el-input v-model="previewPhone" placeholder="输入手机号测试" style="width: 200px" />
        <el-button type="primary" @click="doPreview">预览</el-button>
        <span v-if="previewResult" class="preview-result">
          <el-tag type="warning">{{ previewResult }}</el-tag>
        </span>
      </div>
    </el-card>

    <div class="rules-section">
      <div class="section-header">
        <h4>屏蔽规则</h4>
        <el-button type="primary" size="small" @click="showDialog()">新增规则</el-button>
      </div>
      <el-table :data="rules" stripe v-loading="loading">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="name" label="规则名称" width="120" />
        <el-table-column label="屏蔽类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.mask_type === 'middle' ? '中间位屏蔽' : row.mask_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数" min-width="200">
          <template #default="{ row }">
            前{{ row.reveal_prefix }}位 + 屏蔽{{ row.mask_length }}位 + 后{{ row.reveal_suffix }}位
          </template>
        </el-table-column>
        <el-table-column label="示例" width="160">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getExample(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="toggleRule(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="editing?.id ? '编辑规则' : '新增规则'" width="500px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="如：默认规则" />
        </el-form-item>
        <el-form-item label="屏蔽类型" prop="mask_type">
          <el-select v-model="form.mask_type" style="width: 100%">
            <el-option label="中间位屏蔽" value="middle" />
          </el-select>
        </el-form-item>
        <el-form-item label="前缀保留位数">
          <el-input-number v-model="form.reveal_prefix" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="屏蔽位数">
          <el-input-number v-model="form.mask_length" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="后缀保留位数">
          <el-input-number v-model="form.reveal_suffix" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { maskApi } from '@/api/mask'

const loading = ref(false)
const saving = ref(false)
const rules = ref([])
const previewPhone = ref('13812345678')
const previewResult = ref('')
const dialogVisible = ref(false)
const formRef = ref()
const editing = ref(null)

const form = reactive({
  name: '',
  mask_type: 'middle',
  reveal_prefix: 3,
  mask_length: 4,
  reveal_suffix: 4
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  mask_type: [{ required: true, message: '请选择屏蔽类型', trigger: 'change' }]
}

const getExample = (row) => {
  const phone = '13812345678'
  const prefix = phone.slice(0, row.reveal_prefix)
  const suffix = phone.slice(-row.reveal_suffix)
  return `${prefix}${'*'.repeat(row.mask_length)}${suffix}`
}

const doPreview = async () => {
  if (!previewPhone.value) return
  try {
    const res = await maskApi.preview(previewPhone.value)
    previewResult.value = res.data.masked
  } catch (e) {
    ElMessage.error('预览失败')
  }
}

const showDialog = (row = null) => {
  editing.value = row
  if (row) {
    form.name = row.name
    form.mask_type = row.mask_type
    form.reveal_prefix = row.reveal_prefix
    form.mask_length = row.mask_length
    form.reveal_suffix = row.reveal_suffix
  } else {
    form.name = ''
    form.mask_type = 'middle'
    form.reveal_prefix = 3
    form.mask_length = 4
    form.reveal_suffix = 4
  }
  dialogVisible.value = true
}

const saveRule = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editing.value?.id) {
      await maskApi.updateRule(editing.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await maskApi.createRule(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadRules()
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '保存失败')
  } finally {
    saving.value = false
  }
}

const deleteRule = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该规则？', '删除确认')
    await maskApi.deleteRule(row.id)
    ElMessage.success('删除成功')
    loadRules()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const toggleRule = async (row) => {
  try {
    await maskApi.toggleRule(row.id)
    ElMessage.success('操作成功')
    loadRules()
  } catch (e) {
    ElMessage.error('操作失败')
    loadRules()
  }
}

const loadRules = async () => {
  loading.value = true
  try {
    const res = await maskApi.getRules()
    rules.value = res.data || []
  } catch (e) {
    console.error('Failed to load rules', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRules()
  doPreview()
})
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.desc { color: var(--text-secondary); font-size: 14px; margin: 0; }

.preview-card { margin-bottom: 24px; }
.preview-row { display: flex; gap: 12px; align-items: center; }
.preview-result { margin-left: 16px; font-size: 16px; }

.rules-section { }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h4 { font-size: 16px; font-weight: 600; margin: 0; }
</style>
