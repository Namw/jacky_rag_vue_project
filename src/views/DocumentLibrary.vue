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
            <el-table-column prop="id" label="文档ID" width="120" show-overflow-tooltip />
            <el-table-column prop="title" label="文档标题" min-width="150" />
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column prop="chunkCount" label="分块数" width="80" align="center" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <router-link
                  :to="`/permanent-document/${row.id}`"
                  class="action-link"
                >
                  <el-button type="primary" link size="small">查看详情</el-button>
                </router-link>
                <el-button
                  type="danger"
                  link
                  size="small"
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
import Layout from '@/components/Layout.vue'
import { getCollectionsList, deleteDocument as deleteDocumentApi } from '@/api/document'

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
    // 获取集合列表
    const response = await getCollectionsList()
    // 将集合数据转换为表格格式
    documents.value = (response.collections || []).map(collection => ({
      id: collection.document_id,
      title: collection.category || collection.collection_name,
      category: collection.category,
      chunkCount: collection.chunk_count,
      collectionName: collection.collection_name,
      status: 'completed',
      createdAt: new Date().toISOString()
    }))
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
    await deleteDocumentApi(documentId)
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
