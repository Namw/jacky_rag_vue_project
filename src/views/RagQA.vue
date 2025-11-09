<template>
  <Layout>
    <div class="rag-qa">
      <div class="page-header">
        <h1>RAG 问答</h1>
        <p class="subtitle">基于文档库的智能问答系统</p>
      </div>

      <!-- 模型选择和设置 -->
      <div class="model-section">
        <div class="model-card">
          <div class="model-header">
            <h3>模型选择</h3>
            <span class="model-status" :class="{ loading: isSwitchingModel }">
              {{ isSwitchingModel ? '切换中...' : '就绪' }}
            </span>
          </div>

          <div class="model-settings">
            <div class="setting-group">
              <label>当前模型</label>
              <el-select
                v-model="currentModel"
                :disabled="isSwitchingModel || availableModels.length === 0"
                @change="handleModelChange"
                placeholder="选择模型"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model"
                  :label="model"
                  :value="model"
                />
              </el-select>
            </div>

            <div class="setting-group">
              <label>温度设置</label>
              <div class="temperature-control">
                <el-slider
                  v-model="temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  :disabled="isSwitchingModel"
                  @change="handleTemperatureChange"
                  show-stops
                />
                <span class="temperature-value">{{ temperature.toFixed(1) }}</span>
              </div>
              <p class="setting-hint">值越大，回答越创意；值越小，回答越稳定</p>
            </div>
          </div>

          <div v-if="modelError" class="model-error">
            <el-alert :title="modelError" type="error" closable @close="modelError = null" />
          </div>
        </div>
      </div>

      <!-- 缓存统计 -->
      <div class="cache-section">
        <div class="cache-card">
          <div class="cache-header">
            <h3>语义缓存统计</h3>
            <div class="cache-controls">
              <el-button
                type="primary"
                size="small"
                :loading="isLoadingCache"
                @click="loadCacheStats"
              >
                刷新
              </el-button>
              <el-button
                type="danger"
                size="small"
                :loading="isClearingCache"
                @click="handleClearCache"
              >
                清空缓存
              </el-button>
            </div>
          </div>

          <div v-if="cacheStats && !cacheStats.error" class="cache-stats">
            <div class="stat-item">
              <span class="stat-label">总缓存查询数</span>
              <span class="stat-value">{{ cacheStats.total_cached_queries }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">使用 Rerank 缓存</span>
              <span class="stat-value">{{ cacheStats.rerank_cached }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">普通检索缓存</span>
              <span class="stat-value">{{ cacheStats.normal_cached }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">缓存范围数</span>
              <span class="stat-value">{{ cacheStats.cache_scopes }}</span>
            </div>
          </div>
          <div v-else class="cache-empty">
            <p>{{ cacheStats?.error || '缓存未初始化' }}</p>
          </div>
        </div>
      </div>

      <!-- 使用统计（问答次数） -->
      <div class="usage-section">
        <div class="usage-card">
          <div class="usage-header">
            <h3>问答次数统计</h3>
            <span class="usage-reset" v-if="usageStats && usageStats.next_reset_time">
              重置时间：{{ formatTime(usageStats.next_reset_time) }}
            </span>
          </div>

          <div v-if="usageStats && !usageStats.error" class="usage-stats">
            <div class="quota-card">
              <div class="quota-header">
                <span class="quota-label">今日剩余提问次数</span>
                <span class="quota-number">{{ usageStats.query_remaining }}/{{ usageStats.query_limit }}</span>
              </div>
              <div class="quota-progress">
                <el-progress
                  :percentage="Math.round((usageStats.query_remaining / usageStats.query_limit) * 100)"
                  :color="getQuotaColor(usageStats.query_remaining, usageStats.query_limit)"
                  :show-text="false"
                />
              </div>
              <div class="quota-info">
                <span class="info-text">已使用 {{ usageStats.query_limit - usageStats.query_remaining }} 次，还可提问 {{ usageStats.query_remaining }} 次</span>
              </div>
            </div>
          </div>
          <div v-else class="usage-empty">
            <p>{{ usageStats?.error || '使用统计未初始化' }}</p>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoadingModels" class="loading-container">
        <el-empty description="正在加载模型信息..." />
      </div>

      <!-- 问答界面 -->
      <div v-else class="qa-section">
        <!-- 问题输入 -->
        <div class="input-card">
          <div class="input-header">
            <h3>提出问题</h3>
            <span class="char-count">{{ queryText.length }}/1000</span>
          </div>

          <div class="input-wrapper">
            <el-input
              v-model="queryText"
              type="textarea"
              :rows="4"
              placeholder="输入您的问题（最多1000个字符）..."
              maxlength="1000"
              show-word-limit
              :disabled="isQuerying"
            />
          </div>

          <div class="input-controls">
            <div class="search-params">
              <div class="param-item">
                <label>返回结果数</label>
                <el-input-number
                  v-model="topK"
                  :min="1"
                  :max="20"
                  :disabled="isQuerying"
                />
              </div>
              <div class="param-item">
                <label>相似度阈值</label>
                <div class="threshold-control">
                  <el-slider
                    v-model="threshold"
                    :min="0"
                    :max="1"
                    :step="0.1"
                    :disabled="isQuerying"
                    show-stops
                  />
                  <span class="threshold-value">{{ threshold.toFixed(1) }}</span>
                </div>
                <p class="param-hint">返回相似度大于该值的结果（推荐 0.6-0.8）</p>
              </div>
              <div class="param-item">
                <label>指定文档 ID</label>
                <el-input
                  v-model="documentId"
                  placeholder="留空则检索所有文档"
                  :disabled="isQuerying"
                />
                <p class="param-hint">可选，指定在某个文档中检索</p>
              </div>
              <div class="param-item">
                <label>
                  <el-checkbox v-model="returnSources" :disabled="isQuerying">
                    返回来源
                  </el-checkbox>
                </label>
              </div>
              <div class="param-item">
                <label>
                  <el-checkbox v-model="useRerank" :disabled="isQuerying">
                    启用二次精排
                  </el-checkbox>
                </label>
                <p class="param-hint">使用 Reranker 模型进行精排以提高结果质量</p>
              </div>
            </div>

            <div class="system-prompt">
              <label>自定义系统提示词（可选）</label>
              <el-input
                v-model="systemPrompt"
                type="textarea"
                :rows="2"
                placeholder="自定义系统提示词，如不填写使用默认值"
                :disabled="isQuerying"
              />
              <p class="param-hint">用于指导 AI 如何生成答案</p>
            </div>

            <div class="submit-button">
              <el-button
                type="primary"
                size="large"
                :loading="isQuerying"
                :disabled="!queryText.trim() || isQuerying || isLoadingModels"
                @click="handleQuery"
              >
                {{ isQuerying ? '查询中...' : '提交问题' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 查询结果 -->
        <div v-if="queryResult" class="result-card">
          <div class="result-header">
            <h3>问答结果</h3>
            <span class="result-time">{{ formatTime(queryResult.timestamp) }}</span>
          </div>

          <!-- 问题显示 -->
          <div class="question-display">
            <h4>问题</h4>
            <p>{{ queryResult.question }}</p>
          </div>

          <!-- 回答显示 -->
          <div class="answer-display">
            <h4>回答</h4>
            <div class="answer-content">{{ queryResult.answer }}</div>
            <div class="answer-footer">
              <span class="model-tag">模型：{{ queryResult.model_provider }}</span>
            </div>
          </div>

          <!-- 来源显示 -->
          <div v-if="queryResult.sources && queryResult.sources.length > 0" class="sources-display">
            <h4>参考来源 ({{ queryResult.sources.length }})</h4>
            <div class="sources-list">
              <div
                v-for="(source, index) in queryResult.sources"
                :key="index"
                class="source-item"
              >
                <div class="source-header">
                  <span class="source-name">📄 {{ source.source }}</span>
                  <span class="source-page" v-if="source.page">页码: {{ source.page }}</span>
                  <span class="source-score">相似度: {{ (source.score * 100).toFixed(0) }}%</span>
                </div>
                <div class="source-content">
                  {{ source.content }}
                </div>
              </div>
            </div>
          </div>

          <!-- 清空结果按钮 -->
          <div class="result-actions">
            <el-button @click="clearResult">清空结果</el-button>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="queryError" class="error-container">
          <el-alert :title="queryError" type="error" closable @close="queryError = null" />
        </div>

        <!-- 空状态 -->
        <div v-if="!queryResult && !queryError" class="empty-state">
          <el-empty description="输入问题并提交，获得 AI 的智能回答" />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { getModelInfo, switchModel, queryRag, getCacheStats, clearCache } from '@/api/chat'
import { getUsageStats } from '@/api/document'

// 页面数据
const isLoadingModels = ref(true)
const isSwitchingModel = ref(false)
const isQuerying = ref(false)

// 模型相关
const currentModel = ref('')
const availableModels = ref([])
const temperature = ref(0.7)
const modelError = ref(null)

// 查询相关
const queryText = ref('')
const topK = ref(5)
const returnSources = ref(true)
const useRerank = ref(false)
const threshold = ref(0.6)
const systemPrompt = ref('')
const documentId = ref('')
const queryResult = ref(null)
const queryError = ref(null)

// 缓存相关
const cacheStats = ref(null)
const isLoadingCache = ref(false)
const isClearingCache = ref(false)
let cacheStatsInterval = null

// 使用统计相关（问答次数）
const usageStats = ref(null)
let usageStatsInterval = null

// 时间格式化
const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return timestamp
  }
}

// 获取配额进度条颜色
const getQuotaColor = (remaining, limit) => {
  const percentage = (remaining / limit) * 100
  if (percentage <= 20) {
    return '#f56c6c' // 红色 - 紧急
  } else if (percentage <= 50) {
    return '#e6a23c' // 橙色 - 警告
  } else {
    return '#67c23a' // 绿色 - 充足
  }
}

// 初始化：加载模型信息
const loadModelInfo = async () => {
  isLoadingModels.value = true
  modelError.value = null

  try {
    const response = await getModelInfo()
    currentModel.value = response.current_provider
    availableModels.value = response.available_providers || []
    temperature.value = response.temperature || 0.7
  } catch (error) {
    console.error('加载模型信息失败:', error)
    modelError.value = '加载模型信息失败，请稍后重试'
  } finally {
    isLoadingModels.value = false
  }
}

// 切换模型
const handleModelChange = async () => {
  isSwitchingModel.value = true
  modelError.value = null

  try {
    ElMessage.info('正在切换模型...')
    const response = await switchModel(currentModel.value, temperature.value)
    ElMessage.success(`已切换到 ${response.current_provider}`)
  } catch (error) {
    console.error('切换模型失败:', error)
    modelError.value = error.response?.data?.detail || '切换模型失败，请稍后重试'
    // 恢复前一个模型
    await loadModelInfo()
  } finally {
    isSwitchingModel.value = false
  }
}

// 调整温度
const handleTemperatureChange = async () => {
  if (currentModel.value) {
    isSwitchingModel.value = true
    modelError.value = null

    try {
      await switchModel(currentModel.value, temperature.value)
      ElMessage.success('温度设置已更新')
    } catch (error) {
      console.error('更新温度失败:', error)
      modelError.value = '更新温度失败，请稍后重试'
      // 恢复前一个温度
      await loadModelInfo()
    } finally {
      isSwitchingModel.value = false
    }
  }
}

// 提交查询
const handleQuery = async () => {
  if (!queryText.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  if (queryText.value.length > 1000) {
    ElMessage.error('问题长度不能超过 1000 个字符')
    return
  }

  isQuerying.value = true
  queryError.value = null

  try {
    ElMessage.info('正在查询...')
    const response = await queryRag(
      queryText.value,
      topK.value,
      returnSources.value,
      null,
      systemPrompt.value || null,
      useRerank.value,
      documentId.value || null,
      threshold.value
    )

    queryResult.value = response
    ElMessage.success('查询成功')
  } catch (error) {
    console.error('查询失败:', error)

    // 处理特定错误
    if (error.response?.status === 429) {
      // 问答次数已达上限
      const errorMsg = error.response?.data?.detail || '今日问答次数已达上限，请明天重试'
      queryError.value = errorMsg
      ElMessage.error(errorMsg)
    } else {
      const errorMsg = error.response?.data?.detail || error.message || '查询失败，请稍后重试'
      queryError.value = errorMsg
      ElMessage.error(errorMsg)
    }
  } finally {
    isQuerying.value = false
  }
}

// 清空结果
const clearResult = () => {
  queryResult.value = null
  queryError.value = null
  queryText.value = ''
}

// 获取缓存统计
const loadCacheStats = async () => {
  isLoadingCache.value = true
  try {
    const response = await getCacheStats()
    cacheStats.value = response
  } catch (error) {
    console.error('获取缓存统计失败:', error)
    cacheStats.value = null
  } finally {
    isLoadingCache.value = false
  }
}

// 清空所有缓存
const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有语义缓存吗？此操作不可撤销。',
      '清空缓存',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isClearingCache.value = true
    await clearCache()
    ElMessage.success('缓存已清空')
    await loadCacheStats()
  } catch (error) {
    if (error !== 'cancel') {
      const errorMsg = error.response?.data?.detail || error.message || '清空缓存失败'
      if (errorMsg.includes('Admin only')) {
        ElMessage.error('只有管理员可以清空缓存')
      } else {
        ElMessage.error(errorMsg)
      }
    }
  } finally {
    isClearingCache.value = false
  }
}

// 获取使用统计（问答次数）
const loadUsageStats = async () => {
  try {
    const response = await getUsageStats()
    usageStats.value = response
  } catch (error) {
    console.error('获取使用统计失败:', error)
    usageStats.value = null
  }
}

// 页面加载时获取模型信息、缓存统计和使用统计
onMounted(() => {
  loadModelInfo()
  loadCacheStats()
  loadUsageStats()

  // 每30秒更新一次缓存统计和使用统计
  cacheStatsInterval = setInterval(() => {
    loadCacheStats()
  }, 30000)

  usageStatsInterval = setInterval(() => {
    loadUsageStats()
  }, 30000)
})

// 页面卸载时清空定时器
onBeforeUnmount(() => {
  if (cacheStatsInterval) {
    clearInterval(cacheStatsInterval)
  }
  if (usageStatsInterval) {
    clearInterval(usageStatsInterval)
  }
})
</script>

<style scoped>
.rag-qa {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.page-header .subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 模型选择区域 */
.model-section {
  margin-bottom: 40px;
}

.model-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.model-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.model-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #e6f7ff;
  color: #1890ff;
}

.model-status.loading {
  background: #fff7e6;
  color: #faad14;
}

.model-settings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .model-settings {
    grid-template-columns: 1fr;
  }
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.setting-group :deep(.el-select) {
  width: 100%;
}

.temperature-control {
  display: flex;
  gap: 12px;
  align-items: center;
}

.temperature-control :deep(.el-slider) {
  flex: 1;
}

.temperature-value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  min-width: 40px;
}

.setting-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.model-error {
  margin-top: 16px;
}

/* 加载状态 */
.loading-container {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
}

/* 问答区域 */
.qa-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.input-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.input-wrapper {
  margin-bottom: 20px;
}

.input-wrapper :deep(.el-textarea__inner) {
  font-size: 14px;
  resize: none;
}

.input-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-params {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

@media (max-width: 1024px) {
  .search-params {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .search-params {
    grid-template-columns: 1fr;
  }
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-item label {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.param-item :deep(.el-input-number) {
  width: 100px;
}

.param-item :deep(.el-checkbox) {
  font-size: 13px;
}

.param-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
  padding-top: 2px;
}

.threshold-control {
  display: flex;
  gap: 12px;
  align-items: center;
}

.threshold-control :deep(.el-slider) {
  flex: 1;
}

.threshold-value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  min-width: 40px;
}

.system-prompt {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.system-prompt label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.system-prompt :deep(.el-textarea) {
  width: 100%;
}

.system-prompt :deep(.el-textarea__inner) {
  font-size: 13px;
  resize: none;
}

.submit-button {
  display: flex;
  justify-content: flex-end;
}

.submit-button :deep(.el-button) {
  min-width: 140px;
}

/* 结果卡片 */
.result-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.result-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.result-time {
  font-size: 12px;
  color: #999;
}

.question-display {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
}

.question-display h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.question-display p {
  font-size: 14px;
  color: #555;
  margin: 0;
  line-height: 1.6;
}

.answer-display {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f5ff;
  border-left: 4px solid #667eea;
  border-radius: 6px;
}

.answer-display h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1a1a1a;
}

.answer-content {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.answer-footer {
  display: flex;
  gap: 12px;
}

.model-tag {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.sources-display {
  margin-bottom: 24px;
}

.sources-display h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fafafa;
}

.source-header {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  font-size: 12px;
}

.source-name {
  font-weight: 500;
  color: #1a1a1a;
}

.source-page {
  color: #999;
}

.source-score {
  color: #667eea;
  font-weight: 500;
}

.source-content {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 错误提示 */
.error-container {
  margin-top: 20px;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}

/* 缓存统计区域 */
.cache-section {
  margin-bottom: 40px;
}

.cache-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cache-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.cache-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.cache-controls {
  display: flex;
  gap: 12px;
}

.cache-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
}

.cache-empty {
  text-align: center;
  padding: 30px 20px;
  background: #f9f9f9;
  border-radius: 6px;
  color: #999;
}

/* 使用统计区域 */
.usage-section {
  margin-bottom: 40px;
}

.usage-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.usage-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.usage-reset {
  font-size: 12px;
  color: #999;
}

.usage-stats {
  display: flex;
  flex-direction: column;
}

.quota-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quota-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.quota-number {
  font-size: 20px;
  font-weight: 600;
  color: #667eea;
}

.quota-progress {
  display: flex;
  align-items: center;
}

.quota-progress :deep(.el-progress) {
  flex: 1;
}

.quota-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-text {
  font-size: 12px;
  color: #999;
}

.usage-empty {
  text-align: center;
  padding: 30px 20px;
  background: #f9f9f9;
  border-radius: 6px;
  color: #999;
}
</style>
