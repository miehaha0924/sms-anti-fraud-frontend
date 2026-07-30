<template>
  <div class="rules-page">
    <div class="page-header">
      <h3>策略管理</h3>
      <p class="desc">管理关键词规则和Combo规则的启用状态</p>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="关键词规则" name="keyword">
        <div class="tab-header">
          <el-button type="primary" @click="showKeywordDialog()">新增规则</el-button>
        </div>
        <el-table :data="keywords" stripe v-loading="loading">
          <el-table-column type="index" label="#" width="60" align="center" />
          <el-table-column prop="category" label="分类" width="160" />
          <el-table-column prop="keyword" label="关键词" min-width="200" show-overflow-tooltip />
          <el-table-column prop="weight" label="权重" width="80" align="center" />
          <el-table-column label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.is_regex ? 'warning' : 'info'" round>
                {{ row.is_regex ? '正则' : '普通' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.enabled"
                @change="toggleKeyword(row, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="showKeywordDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteKeyword(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Combo 规则" name="combo">
        <el-table :data="combos" stripe v-loading="loading">
          <el-table-column type="index" label="#" width="60" align="center" />
          <el-table-column prop="category" label="分类" width="160" />
          <el-table-column prop="keywords" label="关键词组合" min-width="300">
            <template #default="{ row }">
              <el-tag v-for="kw in row.keywords" :key="kw" size="small" style="margin: 2px">{{ kw }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bonus_weight" label="权重加成" width="100" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-switch :model-value="row.enabled" @change="toggleCombo(row, $event)" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Keyword Dialog -->
    <el-dialog v-model="keywordDialogVisible" :title="editingKeyword?.id ? '编辑规则' : '新增规则'" width="500px">
      <el-form ref="keywordFormRef" :model="keywordForm" :rules="keywordRules" label-width="80px">
        <el-form-item label="分类" prop="category">
          <el-select v-model="keywordForm.category" placeholder="选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="keywordForm.keyword" placeholder="输入关键词或正则表达式" />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input-number v-model="keywordForm.weight" :min="0.1" :max="10" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="正则">
          <el-switch v-model="keywordForm.is_regex" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="keywordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveKeyword">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { rulesApi } from '@/api/rules'

const activeTab = ref('keyword')
const loading = ref(false)
const saving = ref(false)
const keywords = ref([])
const combos = ref([])
const keywordDialogVisible = ref(false)
const keywordFormRef = ref()
const editingKeyword = ref(null)

const keywordForm = reactive({
  category: '',
  keyword: '',
  weight: 1.0,
  is_regex: false
})

const keywordRules = {
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }]
}

const categories = [
  '色情低俗', '赌博博彩', '非法服务与违禁品', '广告营销', '诱导加好友/引流',
  '仿冒身份', '利益诱导', '情感交友诱导', '威胁恐吓', '骚扰催收', '辱骂攻击'
]

const showKeywordDialog = (row = null) => {
  editingKeyword.value = row
  if (row) {
    keywordForm.category = row.category
    keywordForm.keyword = row.keyword
    keywordForm.weight = row.weight
    keywordForm.is_regex = row.is_regex
  } else {
    keywordForm.category = ''
    keywordForm.keyword = ''
    keywordForm.weight = 1.0
    keywordForm.is_regex = false
  }
  keywordDialogVisible.value = true
}

const saveKeyword = async () => {
  const valid = await keywordFormRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingKeyword.value?.id) {
      await rulesApi.updateKeywordRule(editingKeyword.value.id, keywordForm)
      ElMessage.success('更新成功')
    } else {
      await rulesApi.createKeywordRule(keywordForm)
      ElMessage.success('创建成功')
    }
    keywordDialogVisible.value = false
    loadRules()
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '保存失败')
  } finally {
    saving.value = false
  }
}

const deleteKeyword = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该规则？', '删除确认')
    await rulesApi.deleteKeywordRule(row.id)
    ElMessage.success('删除成功')
    loadRules()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const toggleKeyword = async (row, enabled) => {
  try {
    await rulesApi.toggleKeywordRule(row.id, enabled)
    ElMessage.success(enabled ? '已启用' : '已暂停')
  } catch (e) {
    ElMessage.error('操作失败')
    loadRules()
  }
}

const toggleCombo = async (row, enabled) => {
  try {
    await rulesApi.toggleComboRule(row.id, enabled)
    ElMessage.success(enabled ? '已启用' : '已暂停')
  } catch (e) {
    ElMessage.error('操作失败')
    loadRules()
  }
}

const loadRules = async () => {
  loading.value = true
  try {
    const res = await rulesApi.getRules()
    keywords.value = res.data.keywords || []
    combos.value = res.data.combos || []
  } catch (e) {
    console.error('Failed to load rules', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadRules())
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.desc { color: var(--text-secondary); font-size: 14px; margin: 0; }
.tab-header { margin-bottom: 16px; }
</style>
