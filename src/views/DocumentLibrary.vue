<template>
  <Layout>
    <div class="document-library">
      <div class="header">
        <h1>文档库</h1>
        <div class="controls">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文档..."
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <span>🔍</span>
            </template>
          </el-input>
          <el-button type="primary" @click="refreshDocuments">刷新</el-button>
        </div>
      </div>

      <el-loading v-if="loading" />

      <div class="documents-section" v-if="!loading">
        <div class="table-wrapper">
          <el-table
            :data="filteredDocuments"
            style="width: 100%"
            stripe
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="文档标题" min-width="200" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="chunkCount" label="分块数" width="100" />
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <router-link
                  :to="`/permanent-document/${row.id}`"
                  class="action-link"
                >
                  <el-button type="primary" link>查看详情</el-button>
                </router-link>
                <el-button
                  type="danger"
                  link
                  @click="deleteDocument(row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="documents.length === 0" class="empty-state">
          <p>暂无文档</p>
        </div>
      </div>

      <div class="error-state" v-if="error">
        <el-alert :title="error" type="error" closable @close="error = null" />
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElTag, ElInput, ElLoading, ElAlert, ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import Layout from '@/components/Layout.vue'

const documents = ref([])
const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)

const filteredDocuments = computed(() => {
  if (!searchQuery.value) {
    return documents.value
  }
  return documents.value.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'failed': 'danger'
  }
  return statusMap[status] || 'info'
}

const fetchDocuments = async () => {
  loading.value = true
  error.value = null
  try {
    // 获取所有已入库的文档
    const response = await request.post('/api/documents/permanent')
    // response 已经是 data 对象（通过拦截器处理）
    documents.value = response || []
  } catch (err) {
    error.value = '加载文档失败：' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
}

const refreshDocuments = async () => {
  await fetchDocuments()
  ElMessage.success('刷新成功')
}

const deleteDocument = async (documentId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个文档吗？',
      '提示',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await request.delete(`/api/documents/${documentId}`)
    ElMessage.success('删除成功')
    await fetchDocuments()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败：' + (err.message || '未知错误'))
    }
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.document-library {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.documents-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table-wrapper {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.error-state {
  margin-top: 20px;
}

.action-link {
  text-decoration: none;
}
</style>
