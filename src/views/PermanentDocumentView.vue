<template>
  <Layout>
    <div class="permanent-document">
      <div class="header">
        <h1>正式库文档 - {{ documentId }}</h1>
        <div class="meta-info" v-if="documentData">
          <span class="collection">集合: {{ documentData.permanent_collection_name }}</span>
          <span class="total">总分块数: {{ documentData.total_chunks }}</span>
        </div>
      </div>

      <el-loading v-if="loading" />

      <div class="content-section" v-if="documentData && !loading">
        <div class="chunks-section">
          <h2>文档分块（{{ chunks.length }}/{{ documentData.total_chunks }}）</h2>
          <div class="chunks-list" v-if="chunks.length">
            <div
              v-for="chunk in chunks"
              :key="chunk.chunk_id"
              class="chunk-card"
            >
              <div class="chunk-header">
                <span class="chunk-number">分块 {{ chunk.chunk_index }}</span>
                <span class="chunk-length">{{ chunk.char_count }} 字符</span>
              </div>
              <div class="chunk-meta">
                <span>位置: {{ chunk.start_pos }} - {{ chunk.end_pos }}</span>
              </div>
              <div class="chunk-content">{{ chunk.content }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无分块数据</p>
          </div>

          <!-- 分页控件 -->
          <div class="pagination-section" v-if="documentData && documentData.total_chunks > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              :total="documentData.total_chunks"
              layout="total, sizes, prev, pager, next, jumper"
              @change="handlePageChange"
            />
          </div>
        </div>
      </div>

      <div class="error-state" v-if="error">
        <el-alert :title="error" type="error" closable @close="error = null" />
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElLoading, ElAlert, ElPagination } from 'element-plus'
import request from '@/utils/request'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const documentId = ref('')
const documentData = ref(null)
const chunks = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const error = ref(null)

// 获取文档数据
const fetchDocument = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await request.get(
      `/api/documents/${documentId.value}/permanent`,
      {
        params: {
          page: currentPage.value,
          page_size: pageSize.value
        }
      }
    )
    // 处理API响应 - response已经是data对象（通过拦截器处理）
    documentData.value = response || {}
    chunks.value = response?.chunks || []
  } catch (err) {
    error.value = '加载文档失败：' + (err.response?.data?.detail || err.message || '未知错误')
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePageChange = async () => {
  await fetchDocument()
  // 滚动到顶部
  document.documentElement.scrollTop = 0
}

onMounted(async () => {
  documentId.value = route.params.documentId
  await fetchDocument()
})
</script>

<style scoped>
.permanent-document {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 40px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.meta-info {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
}

.meta-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.content-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.chunks-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.chunks-list {
  display: grid;
  gap: 16px;
}

.chunk-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.3s ease;
}

.chunk-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chunk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.chunk-number {
  font-weight: 600;
  color: #667eea;
}

.chunk-length {
  font-size: 12px;
  color: #999;
}

.chunk-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.chunk-content {
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
}

.pagination-section {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.error-state {
  margin-top: 20px;
}
</style>
