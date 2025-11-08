<template>
  <Layout>
    <div class="collection-search">
      <div class="page-header">
        <router-link to="/document-library" class="back-link">
          <el-button type="primary" link>← 返回文档库</el-button>
        </router-link>
        <h1>{{ category || '集合' }} - 内容检索</h1>
        <p class="subtitle">在当前集合中搜索相关内容</p>
      </div>

      <!-- 搜索参数设置 -->
      <div class="search-config">
        <div class="config-card">
          <div class="input-section">
            <label>检索问题</label>
            <el-input
              v-model="searchQuery"
              type="textarea"
              :rows="3"
              placeholder="输入你的检索问题..."
              maxlength="500"
              show-word-limit
              :disabled="isSearching"
            />
          </div>

          <div class="params-section">
            <div class="param-item">
              <label>返回结果数</label>
              <el-input-number
                v-model="topK"
                :min="1"
                :max="20"
                :disabled="isSearching"
              />
            </div>

            <div class="param-item">
              <label>相似度阈值</label>
              <el-slider
                v-model="threshold"
                :min="0"
                :max="1"
                :step="0.1"
                :disabled="isSearching"
                show-stops
              />
              <span class="threshold-value">{{ threshold.toFixed(1) }}</span>
            </div>

            <div class="param-item">
              <label>
                <el-checkbox v-model="useRerank" :disabled="isSearching">
                  启用二次精排
                </el-checkbox>
              </label>
            </div>
          </div>

          <div class="button-section">
            <el-button
              type="primary"
              size="large"
              :loading="isSearching"
              :disabled="!searchQuery.trim() || isSearching"
              @click="handleSearch"
            >
              {{ isSearching ? '检索中...' : '开始检索' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 检索结果 -->
      <div v-if="searchResults" class="results-section">
        <div class="results-header">
          <h2>检索结果</h2>
          <div class="results-stats">
            <span>找到 {{ searchResults.total_results }} 条结果</span>
            <span>耗时 {{ searchResults.search_time_ms.toFixed(2) }} ms</span>
          </div>
        </div>

        <div v-if="searchResults.results.length > 0" class="results-list">
          <div
            v-for="(result, index) in searchResults.results"
            :key="result.chunk_id"
            class="result-item"
          >
            <div class="result-header">
              <span class="result-number">#{{ index + 1 }}</span>
              <span class="chunk-info">分块 {{ result.chunk_index }}</span>
              <span class="similarity">相似度: {{ (result.similarity_score * 100).toFixed(1) }}%</span>
              <span class="char-count">{{ result.char_count }} 字符</span>
            </div>
            <div class="result-content">
              {{ result.content }}
            </div>
            <div class="result-footer">
              <span class="position">位置: {{ result.start_pos }}-{{ result.end_pos }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-results">
          <p>未找到匹配的内容</p>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-container">
        <el-alert :title="error" type="error" closable @close="error = null" />
      </div>

      <!-- 空状态 -->
      <div v-if="!searchResults && !isSearching && !error" class="empty-state">
        <el-empty description="输入检索问题并点击按钮开始搜索" />
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { searchCollection } from '@/api/document'

const route = useRoute()
const documentId = ref('')
const category = ref('')
const searchQuery = ref('')
const topK = ref(5)
const threshold = ref(0.5)
const useRerank = ref(false)
const isSearching = ref(false)
const searchResults = ref(null)
const error = ref(null)

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入检索问题')
    return
  }

  isSearching.value = true
  error.value = null

  try {
    ElMessage.info('正在检索...')
    const response = await searchCollection(
      documentId.value,
      searchQuery.value,
      topK.value,
      threshold.value,
      useRerank.value
    )
    searchResults.value = response
    ElMessage.success('检索完成')
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || '检索失败，请稍后重试'
    error.value = errorMsg
    ElMessage.error(errorMsg)
  } finally {
    isSearching.value = false
  }
}

onMounted(() => {
  documentId.value = route.params.documentId
  category.value = route.params.category || '集合'
})
</script>

<style scoped>
.collection-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 40px;
}

.back-link {
  display: block;
  margin-bottom: 16px;
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

/* 搜索配置 */
.search-config {
  margin-bottom: 40px;
}

.config-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.input-section {
  margin-bottom: 24px;
}

.input-section label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.input-section :deep(.el-textarea__inner) {
  font-size: 14px;
  resize: none;
}

.params-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item label {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.param-item :deep(.el-input-number) {
  width: 100%;
}

.param-item :deep(.el-slider) {
  margin-right: 12px;
}

.threshold-value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  min-width: 40px;
}

.button-section {
  display: flex;
  justify-content: flex-end;
}

.button-section :deep(.el-button) {
  min-width: 140px;
}

/* 结果区域 */
.results-section {
  margin-bottom: 40px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.results-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.results-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.3s ease;
}

.result-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.result-number {
  font-weight: 600;
  color: #667eea;
}

.chunk-info {
  font-weight: 500;
  color: #1a1a1a;
}

.similarity {
  color: #52c41a;
  font-weight: 500;
}

.char-count {
  color: #999;
}

.result-content {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  background: #fafafa;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.result-footer {
  font-size: 12px;
  color: #999;
}

.empty-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
}

/* 错误提示 */
.error-container {
  margin-bottom: 20px;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}
</style>
