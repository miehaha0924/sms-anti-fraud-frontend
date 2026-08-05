<template>
  <div class="import-page">
    <div class="page-header">
      <div class="header-left">
        <h2>文件导入</h2>
        <p class="page-desc">管理短信数据文件的导入任务与批次处理记录</p>
      </div>
    </div>

    <!-- Import Files -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left-inline">
            <el-icon :size="18" color="var(--primary)"><Upload /></el-icon>
            <span class="card-title">导入文件</span>
          </div>
          <el-tag size="small" type="info">{{ store.importFiles.length }} 个文件</el-tag>
        </div>
      </template>
      <el-table :data="store.importFiles" stripe v-loading="store.loading" class="main-table">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="filename" label="文件名" min-width="240">
          <template #default="{ row }">
            <span class="filename">{{ row.filename }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="task_date" label="日期" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.task_date }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="{ importing: 'warning', imported: 'success', failed: 'danger', duplicate: 'info' }[row.status]"
              effect="light"
              round
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_rows" label="总行数" width="100" align="center">
          <template #default="{ row }"><span class="num-badge">{{ row.total_rows }}</span></template>
        </el-table-column>
        <el-table-column prop="valid_rows" label="有效行" width="100" align="center">
          <template #default="{ row }"><span class="num-badge success">{{ row.valid_rows }}</span></template>
        </el-table-column>
        <el-table-column prop="invalid_rows" label="无效行" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.invalid_rows > 0 ? 'invalid-badge' : 'num-badge'">{{ row.invalid_rows }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="error_summary" label="错误信息" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewBatches(row)" :icon="List">批次</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Batches Dialog -->
    <el-dialog v-model="batchesVisible" :title="'导入批次 - ' + (currentFile?.filename || '')" width="85%" class="import-dialog">
      <el-table :data="fileBatches" stripe v-loading="batchLoading" class="batch-table">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="batch_no" label="批次号" width="180">
          <template #default="{ row }"><code>{{ row.batch_no }}</code></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="{ pending: 'info', processing: 'warning', done: 'success', failed: 'danger' }[row.status]"
              effect="light"
              round
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="row_count" label="记录数" width="100" align="center">
          <template #default="{ row }"><span class="num-badge">{{ row.row_count }}</span></template>
        </el-table-column>
        <el-table-column label="处理时间" width="180">
          <template #default="{ row }">{{ formatTime(row.processed_at) }}</template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewBatchDetail(row)" :icon="View">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- Batch Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="'批次详情 - ' + (currentBatch?.batch_no || '')" width="85%" class="import-dialog">
      <el-descriptions v-if="batchDetail" :column="2" border class="detail-descriptions">
        <el-descriptions-item label="批次号"><code>{{ batchDetail.batch_no }}</code></el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="{ pending: 'info', processing: 'warning', done: 'success', failed: 'danger' }[batchDetail.status]"
            effect="light"
            round
          >
            {{ batchDetail.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="文件">{{ batchDetail.filename }}</el-descriptions-item>
        <el-descriptions-item label="总记录数"><span class="num-badge">{{ batchDetail.row_count }}</span></el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatTime(batchDetail.processed_at) }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">{{ batchDetail.error_message || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="records-title">
        <el-divider>
          <el-text size="small" strong>原始记录</el-text>
        </el-divider>
      </div>

      <el-table :data="batchRecords" stripe v-loading="recordLoading" class="record-table" max-height="450">
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="row_no" label="行号" width="80" align="center" />
        <el-table-column prop="caller" label="发送方" width="150">
          <template #default="{ row }"><code>{{ row.caller }}</code></template>
        </el-table-column>
        <el-table-column prop="callee" label="接收方" width="150">
          <template #default="{ row }"><code>{{ row.callee }}</code></template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
        <el-table-column prop="receive_time" label="接收时间" width="180" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="{ inserted: 'success', skipped_dedup: 'info', skipped_similar: 'warning', error: 'danger' }[row.status]"
              size="small"
              effect="light"
              round
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parse_error" label="解析错误" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSmsStore } from '@/stores/sms'
import { formatTime } from '@/utils/format'
import { Upload, List, View } from '@element-plus/icons-vue'

const store = useSmsStore()
const batchesVisible = ref(false)
const detailVisible = ref(false)
const currentFile = ref(null)
const currentBatch = ref(null)
const fileBatches = ref([])
const batchDetail = ref(null)
const batchRecords = ref([])
const batchLoading = ref(false)
const recordLoading = ref(false)

const viewBatches = async (row) => {
  currentFile.value = row
  batchesVisible.value = true
  batchLoading.value = true
  try {
    await store.fetchImportBatches({ task_date: row.task_date })
    fileBatches.value = store.importBatches
  } finally {
    batchLoading.value = false
  }
}

const viewBatchDetail = async (row) => {
  currentBatch.value = row
  detailVisible.value = true
  batchDetail.value = null
  batchRecords.value = []
  recordLoading.value = true
  try {
    await store.fetchImportBatchDetail(row.batch_id || row.id)
    batchDetail.value = store.importBatchDetail
    batchRecords.value = batchDetail.value?.raw_records || []
  } finally {
    recordLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchImportFiles(),
    store.fetchImportBatches(),
  ])
})
</script>

<style scoped>
.import-page { width: 100%; }

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  letter-spacing: 0.5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.table-card { margin-bottom: 16px; }
.table-card :deep(.el-card__body) { padding: 0; }

.main-table { width: 100%; }

.filename {
  font-weight: 500;
  color: var(--text-primary);
}

.num-badge {
  font-weight: 700;
  font-size: 15px;
  color: var(--primary);
}

.num-badge.success { color: var(--success); }
.invalid-badge { font-weight: 700; color: var(--danger); }

.batch-table, .record-table { width: 100%; }

.detail-descriptions { margin-bottom: 20px; }

.records-title { margin-top: 8px; margin-bottom: 12px; }
</style>
