import { defineStore } from "pinia"
import { ref } from "vue"
import * as smsApi from "@/api/sms"

export const useSmsStore = defineStore("sms", () => {
  const task = ref(null)
  const trendData = ref([])
  const categoryStats = ref([])

  const callers = ref([])
  const total = ref(0)
  const callerStats = ref({ high_risk: 0, medium_risk: 0, low_risk: 0 })
  const callerDetail = ref(null)
  const callerMessages = ref([])

  const clusters = ref([])
  const diffs = ref([])
  const candidateRules = ref([])
  const blacklistTracebacks = ref([])
  const rules = ref([])

  const llmSummary = ref([])
  const llmLogs = ref([])

  const importFiles = ref([])
  const importBatches = ref([])
  const importBatchDetail = ref(null)

  const overview = ref(null)

  const loading = ref(false)
  const taskList = ref([])
  const taskListTotal = ref(0)

  async function fetchOverview() {
    try {
      const { data } = await smsApi.getOverview()
      overview.value = data
    } catch(e) {
      overview.value = null
    }
  }

  async function fetchTaskList(params) {
    loading.value = true
    try {
      const { data } = await smsApi.listTasks(params)
      taskList.value = data.items || []
      taskListTotal.value = data.total || 0
    } finally { loading.value = false }
  }

  async function fetchTask(taskDate) {
    loading.value = true
    try {
      const { data } = await smsApi.getTask(taskDate)
      task.value = data
    } finally { loading.value = false }
  }

  async function createTask(taskDate, mode = "rule_only") {
    loading.value = true
    try {
      const { data } = await smsApi.createTask(taskDate, mode)
      return data
    } finally { loading.value = false }
  }

  async function finishTask(taskDate, mode = "rule_only") {
    loading.value = true
    try {
      const { data } = await smsApi.finishTask(taskDate, mode)
      return data
    } finally { loading.value = false }
  }

  async function fetchCallers(params) {
    loading.value = true
    try {
      // 直接使用传入的 limit/offset 参数
      const limit = params?.limit || 20
      const offset = params?.offset ?? 0
      const { data } = await smsApi.getCallers({ ...params, limit, offset })
      callers.value = data.items || data
      total.value = data.total || callers.value.length
      callerStats.value = {
        high_risk: data.high_risk || 0,
        medium_risk: data.medium_risk || 0,
        low_risk: data.low_risk || 0,
      }
    } finally { loading.value = false }
  }

  async function fetchCallerDetail(caller, params) {
    loading.value = true
    try {
      const { data } = await smsApi.getCaller(caller, { task_date: params?.task_date, intermediate: params?.intermediate })
      callerDetail.value = data
    } finally { loading.value = false }
  }

  async function fetchCallerMessages(caller, params) {
    loading.value = true
    try {
      const page = params?.page || 1
      const pageSize = params?.page_size || 20
      const offset = (page - 1) * pageSize
      const { data } = await smsApi.getCallerMessages(caller, { task_date: params?.task_date, limit: pageSize, offset })
      callerMessages.value = data.items || data
      if (data.total !== undefined) total.value = data.total
    } finally { loading.value = false }
  }

  async function getMessage(smsId) {
    const { data } = await smsApi.getMessage(smsId)
    return data
  }

  async function fetchClusters(params) {
    const { data } = await smsApi.getFraudClusters(params)
    clusters.value = data.items || data
  }

  async function fetchDiffs(params) {
    const { data } = await smsApi.getDayEndDiffs(params)
    diffs.value = data.items || data
  }

  async function fetchCandidateRules(params) {
    const { data } = await smsApi.getCandidateRules(params)
    candidateRules.value = data.items || data
  }

  async function approveRule(candidateId) {
    await smsApi.approveCandidateRule(candidateId)
  }

  async function simulateRule(candidateId) {
    const { data } = await smsApi.simulateCandidateRule(candidateId)
    return data
  }

  async function fetchBlacklistTraceback(params) {
    const { data } = await smsApi.getBlacklistTraceback(params)
    blacklistTracebacks.value = data.items || data
  }

  async function fetchRules() {
    const { data } = await smsApi.getRules()
    rules.value = data
  }

  async function fetchLlmSummary(params) {
    const { data } = await smsApi.getLlmLogsSummary(params)
    llmSummary.value = data.items || data
  }

  async function fetchLlmLogs(params) {
    const { data } = await smsApi.getLlmLogs(params)
    llmLogs.value = data.items || data
  }

  async function fetchImportFiles(params) {
    const { data } = await smsApi.getImportFiles(params)
    importFiles.value = data
  }

  async function fetchImportBatches(params) {
    const { data } = await smsApi.getImportBatches(params)
    importBatches.value = data.items || data
  }

  async function fetchImportBatchDetail(batchId) {
    const { data } = await smsApi.getImportBatch(batchId)
    importBatchDetail.value = data
  }

  return {
    taskList, taskListTotal, fetchTaskList,
    task, trendData, categoryStats,
    fetchTask, createTask, finishTask,
    callers, total, callerStats, callerDetail, callerMessages,
    fetchCallers, fetchCallerDetail, fetchCallerMessages, getMessage,
    clusters, diffs, candidateRules, blacklistTracebacks,
    fetchClusters, fetchDiffs, fetchCandidateRules, approveRule, simulateRule, fetchBlacklistTraceback,
    rules, fetchRules,
    llmSummary, llmLogs, fetchLlmSummary, fetchLlmLogs,
    importFiles, importBatches, importBatchDetail,
    fetchImportFiles, fetchImportBatches, fetchImportBatchDetail,
    overview, fetchOverview,
    loading,
  }
})
