<template>
  <Layout>
    <div class="document-chunking">
      <div class="page-header">
        <h1>文档分块</h1>
        <p class="subtitle">上传文档并配置分块参数</p>
      </div>

      <!-- 第一步：文档上传 -->
      <div class="step-container" v-if="currentStep === 'upload'">
        <div class="step-header">
          <span class="step-number">1</span>
          <h2>上传文档</h2>
        </div>

        <div class="upload-area" @dragover.prevent @drop.prevent="handleFileDrop">
          <div class="upload-content">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <h3>拖拽文件到此处或点击选择</h3>
            <p>仅支持 PDF 格式，文件大小不超过 5MB</p>
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              class="file-input"
              accept=".pdf"
            />
            <button class="select-btn" @click="$refs.fileInput.click()">
              选择文件
            </button>
          </div>
        </div>

        <!-- 已选择文件展示 -->
        <div class="selected-files" v-if="selectedFile">
          <div class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button class="remove-btn" @click="removeFile">✕</button>
          </div>
        </div>

        <!-- 上传按钮 -->
        <div class="action-buttons" v-if="selectedFile">
          <button class="btn-cancel" @click="selectedFile = null" :disabled="isUploading">
            取消
          </button>
          <button class="btn-primary" @click="handleUploadConfirm" :disabled="isUploading">
            {{ isUploading ? '上传中...' : '确认上传' }}
          </button>
        </div>
      </div>

      <!-- 第二步：分块参数配置 -->
      <div class="step-container" v-if="currentStep === 'config'">
        <div class="step-header">
          <span class="step-number">2</span>
          <h2>分块参数配置</h2>
        </div>

        <!-- 文档信息展示 -->
        <div class="document-info" v-if="uploadedDocument">
          <div class="info-card">
            <div class="info-item">
              <span class="info-label">文档名称</span>
              <span class="info-value">{{ uploadedDocument.filename }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">文件大小</span>
              <span class="info-value">{{ formatFileSize(uploadedDocument.file_size) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">页数</span>
              <span class="info-value">{{ uploadedDocument.page_count }} 页</span>
            </div>
            <div class="info-item">
              <span class="info-label">文档 ID</span>
              <span class="info-value id-value">{{ uploadedDocument.document_id }}</span>
            </div>
          </div>
        </div>

        <div class="config-form">
          <div class="form-group">
            <label for="chunk-size">分块大小（字符数）</label>
            <input
              id="chunk-size"
              v-model.number="chunkConfig.chunkSize"
              type="number"
              placeholder="例如：500"
              min="100"
              max="2000"
            />
            <p class="form-hint">范围：100-2000 字符，推荐 500-1000</p>
          </div>

          <div class="form-group">
            <label for="overlap">重叠大小（字符数）</label>
            <input
              id="overlap"
              v-model.number="chunkConfig.overlap"
              type="number"
              placeholder="例如：50"
              min="0"
              max="500"
            />
            <p class="form-hint">范围：0-500 字符，用于保持上下文连贯性</p>
          </div>

          <div class="form-group">
            <label for="separator">分块分隔符</label>
            <select id="separator" v-model="chunkConfig.separator">
              <option value="">默认（推荐）</option>
              <option value="\n\n">段落分割（换行符）</option>
              <option value="。">句子分割（句号）</option>
            </select>
            <p class="form-hint">选择文档的主要分割方式</p>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-cancel" @click="goBackToUpload">
            返回
          </button>
          <button class="btn-primary" @click="handleConfigConfirm">
            确认配置
          </button>
        </div>
      </div>

      <!-- 第三步：分块处理中 -->
      <div class="step-container" v-if="currentStep === 'processing'">
        <div class="step-header">
          <span class="step-number">3</span>
          <h2>分块处理中</h2>
        </div>

        <div class="processing-area">
          <div class="spinner"></div>
          <p class="processing-text">正在处理文档分块，请稍候...</p>
          <p class="processing-detail">
            已处理: <span class="progress-value">{{ processingProgress }}%</span>
          </p>
        </div>
      </div>

      <!-- 第四步：分块内容查看 -->
      <div class="step-container" v-if="currentStep === 'preview'">
        <div class="step-header">
          <span class="step-number">4</span>
          <h2>分块内容查看</h2>
        </div>

        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">总分块数</span>
            <span class="stat-value">{{ chunkStats.total_chunks || mockChunks.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总字符数</span>
            <span class="stat-value">{{ chunkStats.total_chars || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均分块大小</span>
            <span class="stat-value">{{ avgChunkSize }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">分块配置</span>
            <span class="stat-value">{{ chunkStats.chunk_size }}/{{ chunkStats.overlap }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">文档分类</span>
            <span class="stat-value">{{ chunkStats.category || '未分类' }}</span>
          </div>
        </div>

        <div class="chunks-list">
          <div
            class="chunk-item"
            v-for="(chunk, index) in mockChunks"
            :key="index"
          >
            <div class="chunk-header">
              <span class="chunk-index">分块 {{ chunk.index + 1 }}</span>
              <span class="chunk-size">{{ chunk.char_count || chunk.content.length }} 字符</span>
            </div>
            <div class="chunk-content">
              {{ chunk.content }}
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-secondary" @click="goBackToConfig">
            返回配置
          </button>
          <button class="btn-primary" @click="startVectorization">
            开始检索体验
          </button>
        </div>
      </div>

      <!-- 第五步：文本向量化处理 -->
      <div class="step-container" v-if="currentStep === 'vectorizing'">
        <div class="step-header">
          <span class="step-number">5</span>
          <h2>文本向量化处理</h2>
        </div>

        <div class="processing-area">
          <div class="spinner"></div>
          <p class="processing-text">正在进行向量化处理，请稍候...</p>
          <p class="processing-detail">
            已处理: <span class="progress-value">{{ vectorProgress }}%</span>
          </p>
        </div>
      </div>

      <!-- 第六步：检索体验 -->
      <div class="step-container" v-if="currentStep === 'retrieval'">
        <div class="step-header">
          <span class="step-number">6</span>
          <h2>检索体验</h2>
        </div>

        <div class="search-section">
          <div class="search-params">
            <div class="param-group">
              <label for="search-top-k">返回结果数 (Top-K)</label>
              <input
                id="search-top-k"
                v-model.number="searchTopK"
                type="number"
                min="1"
                max="20"
                placeholder="5"
                :disabled="isSearching"
              />
              <p class="param-hint">范围：1-20</p>
            </div>
            <div class="param-group">
              <label for="search-threshold">相似度阈值</label>
              <input
                id="search-threshold"
                v-model.number="searchThreshold"
                type="number"
                min="0"
                max="1"
                step="0.1"
                placeholder="0.5"
                :disabled="isSearching"
              />
              <p class="param-hint">范围：0.0-1.0</p>
            </div>
            <div class="param-group checkbox-group">
              <label for="use-rerank" class="checkbox-label">
                <input
                  id="use-rerank"
                  v-model="useRerank"
                  type="checkbox"
                  class="checkbox-input"
                  :disabled="isSearching"
                />
                <span>启用二次精排</span>
              </label>
              <p class="param-hint">使用 Reranker 模型进行精排以提高结果质量</p>
            </div>
          </div>
          <div class="search-box">
            <input
              v-model="queryText"
              type="text"
              placeholder="输入您的问题..."
              @keyup.enter="performRetrieval"
              class="search-input"
              :disabled="isSearching"
            />
            <button class="btn-search" @click="performRetrieval" :disabled="isSearching">
              {{ isSearching ? '检索中...' : '🔍 检索' }}
            </button>
          </div>
        </div>

        <!-- 检索结果 -->
        <div class="retrieval-results" v-if="retrievalResults.length > 0">
          <h3>检索结果（{{ retrievalResults.length }} 项）</h3>
          <div
            class="result-item"
            v-for="(result, index) in retrievalResults"
            :key="index"
          >
            <div class="result-header">
              <div class="result-title">
                <span class="result-index">结果 {{ index + 1 }}</span>
                <span class="result-chunk-id">分块 #{{ result.chunk_index + 1 }}</span>
              </div>
              <span class="result-score">相关度: {{ result.score }}%</span>
            </div>
            <div class="result-content">
              {{ result.content }}
            </div>
            <div class="result-footer">
              <span class="result-meta">字符数: {{ result.char_count }}</span>
              <span class="result-meta">相似度分数: {{ result.similarity_score.toFixed(4) }}</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-secondary" @click="goBackToPreview">
            返回分块内容
          </button>
          <button class="btn-primary" @click="confirmAndArchive">
            确认存档
          </button>
        </div>
      </div>
    </div>

    <!-- 确认入库对话框 -->
    <div class="confirm-dialog-overlay" v-if="showConfirmDialog" @click="handleConfirmDialogCancel">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3>确认入库</h3>
          <button class="dialog-close" @click="handleConfirmDialogCancel">✕</button>
        </div>
        <div class="dialog-body">
          <p class="warning-icon">⚠️</p>
          <p class="warning-title">确定要将此文档入库吗？</p>
          <p class="warning-text">
            入库后，临时向量数据将迁移到正式库永久保存。此操作不可逆，入库后无法再修改分块参数。
          </p>
          <div class="document-info-inline">
            <p><strong>文档名称：</strong> {{ uploadedDocument?.filename }}</p>
            <p><strong>总分块数：</strong> {{ chunkStats.total_chunks }} 个</p>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="handleConfirmDialogCancel" :disabled="isConfirming">
            取消
          </button>
          <button class="btn-primary" @click="handleConfirmDialogConfirm" :disabled="isConfirming">
            {{ isConfirming ? '入库中...' : '确认入库' }}
          </button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { uploadDocument, chunkDocument, vectorizeDocument, searchDocument, confirmDocument } from '@/api/document'

const router = useRouter()

const currentStep = ref('upload')
const selectedFile = ref(null)
const fileInput = ref(null)
const queryText = ref('')
const processingProgress = ref(0)
const vectorProgress = ref(0)
const isUploading = ref(false)
const isSearching = ref(false)
const isConfirming = ref(false)
const showConfirmDialog = ref(false)
const searchTopK = ref(5)
const searchThreshold = ref(0.5)
const useRerank = ref(false)

// 保存上传成功后的文档信息
const uploadedDocument = ref(null)

// 保存分块统计信息
const chunkStats = ref({
  total_chunks: 0,
  total_chars: 0,
  chunk_size: 500,
  overlap: 50,
  category: ''
})

const chunkConfig = ref({
  chunkSize: 500,
  overlap: 50,
  separator: ''
})

// 分块数据
const mockChunks = ref([
  { content: '这是第一个分块的内容。这是用于演示文档分块的示例文本。', char_count: 30, index: 0 },
  { content: '这是第二个分块的内容。包含更多的示例文本来说明分块的过程。', char_count: 30, index: 1 },
  { content: '这是第三个分块的内容。最后的分块部分包含总结信息。', char_count: 28, index: 2 }
])

const retrievalResults = ref([])

const avgChunkSize = computed(() => {
  if (mockChunks.value.length === 0) return 0
  const total = mockChunks.value.reduce((sum, chunk) => sum + chunk.content.length, 0)
  return Math.round(total / mockChunks.value.length)
})

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleFileDrop = (e) => {
  const files = e.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]

    // 验证文件类型（仅支持 PDF）
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      ElMessage.error('仅支持上传 PDF 格式文件')
      return
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      ElMessage.error(`文件大小不能超过 5MB，当前文件大小为 ${formatFileSize(file.size)}`)
      return
    }

    selectedFile.value = file
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    const file = files[0]

    // 验证文件类型（仅支持 PDF）
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      ElMessage.error('仅支持上传 PDF 格式文件')
      return
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      ElMessage.error(`文件大小不能超过 5MB，当前文件大小为 ${formatFileSize(file.size)}`)
      return
    }

    selectedFile.value = file
  }
}

const removeFile = () => {
  selectedFile.value = null
  uploadedDocument.value = null
}

const handleUploadConfirm = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  // 再次验证文件
  if (!selectedFile.value.name.toLowerCase().endsWith('.pdf')) {
    ElMessage.error('仅支持上传 PDF 格式文件')
    return
  }

  const maxSize = 5 * 1024 * 1024
  if (selectedFile.value.size > maxSize) {
    ElMessage.error('文件大小不能超过 5MB')
    return
  }

  // 开始上传
  isUploading.value = true
  try {
    ElMessage.info('正在上传文档...')
    const response = await uploadDocument(selectedFile.value)

    // 保存上传后的文档信息
    uploadedDocument.value = response

    ElMessage.success(`文档上传成功！共 ${response.page_count} 页`)

    // 跳转到配置页面
    currentStep.value = 'config'
  } catch (error) {
    console.error('文档上传失败:', error)

    // 处理特定错误
    if (error.response?.status === 400) {
      ElMessage.error(error.response?.data?.detail || '文件格式或大小错误')
    } else if (error.response?.status === 401) {
      ElMessage.error('未授权，请重新登录')
    } else {
      ElMessage.error('文档上传失败，请稍后重试')
    }
  } finally {
    isUploading.value = false
  }
}

const goBackToUpload = () => {
  currentStep.value = 'upload'
  selectedFile.value = null
  uploadedDocument.value = null
}

const handleConfigConfirm = async () => {
  if (!uploadedDocument.value) {
    ElMessage.error('请先上传文档')
    return
  }

  currentStep.value = 'processing'
  processingProgress.value = 0

  try {
    ElMessage.info('正在处理文档分块...')

    // 模拟进度更新（实际API可能不返回进度）
    const progressInterval = setInterval(() => {
      if (processingProgress.value < 90) {
        processingProgress.value += Math.random() * 20
      }
    }, 500)

    // 调用分块 API
    const response = await chunkDocument(uploadedDocument.value.document_id, {
      chunk_size: chunkConfig.value.chunkSize,
      overlap: chunkConfig.value.overlap,
      separator: chunkConfig.value.separator || '\n\n'
    })

    clearInterval(progressInterval)
    processingProgress.value = 100

    // 保存分块数据
    mockChunks.value = response.chunks.map(chunk => ({
      content: chunk.content,
      char_count: chunk.char_count,
      index: chunk.index
    }))

    // 保存分块统计信息
    chunkStats.value = {
      total_chunks: response.total_chunks,
      total_chars: response.total_chars,
      chunk_size: response.chunk_size,
      overlap: response.overlap,
      category: response.category
    }

    ElMessage.success(`分块成功！共产生 ${response.total_chunks} 个分块`)

    // 延迟跳转到预览页面
    setTimeout(() => {
      currentStep.value = 'preview'
    }, 500)
  } catch (error) {
    console.error('文档分块失败:', error)

    // 处理特定错误
    if (error.response?.status === 400) {
      ElMessage.error(error.response?.data?.detail || '分块参数错误')
    } else if (error.response?.status === 404) {
      ElMessage.error('文档不存在或已删除')
    } else {
      ElMessage.error('文档分块失败，请稍后重试')
    }

    currentStep.value = 'config'
  }
}

const goBackToConfig = () => {
  currentStep.value = 'config'
  // 清除分块数据，如果需要重新分块
  // mockChunks.value = []
  // chunkStats.value = { total_chunks: 0, total_chars: 0, chunk_size: 500, overlap: 50 }
}

const startVectorization = async () => {
  if (!uploadedDocument.value) {
    ElMessage.error('请先上传文档')
    return
  }

  currentStep.value = 'vectorizing'
  vectorProgress.value = 0

  try {
    ElMessage.info('正在进行向量化处理...')

    // 模拟进度更新（实际API可能不返回进度）
    const progressInterval = setInterval(() => {
      if (vectorProgress.value < 90) {
        vectorProgress.value += Math.random() * 20
      }
    }, 500)

    // 调用向量化 API
    const response = await vectorizeDocument(uploadedDocument.value.document_id)

    clearInterval(progressInterval)
    vectorProgress.value = 100

    ElMessage.success(`向量化成功！共处理 ${response.total_chunks} 个文本块，嵌入维度 ${response.embedding_dim}`)

    // 延迟跳转到检索页面
    setTimeout(() => {
      currentStep.value = 'retrieval'
    }, 500)
  } catch (error) {
    console.error('文档向量化失败:', error)

    // 处理特定错误
    if (error.response?.status === 400) {
      ElMessage.error(error.response?.data?.detail || '文档状态错误，需要先分块')
    } else if (error.response?.status === 500) {
      ElMessage.error('向量化失败，请稍后重试')
    } else {
      ElMessage.error('向量化失败，请稍后重试')
    }

    currentStep.value = 'preview'
  }
}

const goBackToPreview = () => {
  currentStep.value = 'preview'
  retrievalResults.value = []
  queryText.value = ''
}

const performRetrieval = async () => {
  if (!queryText.value.trim()) {
    ElMessage.warning('请输入搜索问题')
    return
  }

  if (!uploadedDocument.value) {
    ElMessage.error('请先上传并分块文档')
    return
  }

  isSearching.value = true

  try {
    ElMessage.info('正在检索...')

    // 调用检索 API
    const response = await searchDocument(
      uploadedDocument.value.document_id,
      queryText.value,
      searchTopK.value,
      searchThreshold.value,
      useRerank.value
    )

    // 转换 API 响应格式为前端显示格式
    retrievalResults.value = response.results.map(result => ({
      content: result.content,
      score: Math.round(result.similarity_score * 100), // 转换为百分比
      chunk_index: result.chunk_index,
      chunk_id: result.chunk_id,
      char_count: result.char_count,
      similarity_score: result.similarity_score
    }))

    if (retrievalResults.value.length === 0) {
      ElMessage.info('未找到相关内容，请尝试修改搜索问题')
    } else {
      ElMessage.success(`检索成功！找到 ${response.total_results} 个相关结果`)
    }
  } catch (error) {
    console.error('检索失败:', error)

    // 处理特定错误
    if (error.response?.status === 400) {
      ElMessage.error(error.response?.data?.detail || '文档状态错误，需要先向量化')
    } else if (error.response?.status === 500) {
      ElMessage.error('检索失败，请稍后重试')
    } else {
      ElMessage.error('检索失败，请稍后重试')
    }
  } finally {
    isSearching.value = false
  }
}

const confirmAndArchive = async () => {
  if (!uploadedDocument.value) {
    ElMessage.error('请先上传文档')
    return
  }

  // 显示二次确认对话框
  showConfirmDialog.value = true
}

const handleConfirmDialogConfirm = async () => {
  showConfirmDialog.value = false
  isConfirming.value = true

  try {
    ElMessage.info('正在入库...')

    // 调用确认入库 API
    const response = await confirmDocument(uploadedDocument.value.document_id)

    ElMessage.success(`文档已成功入库！共 ${response.total_chunks} 个文本块，存储集合：${response.permanent_collection_name}`)

    // 延迟后跳转到正式库文档查看页面
    setTimeout(() => {
      router.push({
        name: 'PermanentDocument',
        params: { documentId: uploadedDocument.value.document_id }
      })
    }, 1500)
  } catch (error) {
    console.error('文档入库失败:', error)

    // 处理特定错误
    if (error.response?.status === 400) {
      ElMessage.error(error.response?.data?.detail || '文档状态错误，需要先向量化')
    } else if (error.response?.status === 403) {
      ElMessage.error('无权访问此文档')
    } else if (error.response?.status === 404) {
      ElMessage.error('文档不存在')
    } else if (error.response?.status === 500) {
      ElMessage.error('入库失败，请稍后重试')
    } else {
      ElMessage.error('入库失败，请稍后重试')
    }
  } finally {
    isConfirming.value = false
  }
}

const handleConfirmDialogCancel = () => {
  showConfirmDialog.value = false
}

const simulateProgress = (callback, type = 'chunk') => {
  const progressRef = type === 'vector' ? vectorProgress : processingProgress
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 30
    if (progress >= 100) {
      progress = 100
      progressRef.value = progress
      clearInterval(interval)
      setTimeout(callback, 500)
    } else {
      progressRef.value = Math.round(progress)
    }
  }, 500)
}
</script>

<style scoped>
.document-chunking {
  max-width: 1200px;
  margin: 0 auto;
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

.step-container {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.step-header h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  margin-bottom: 32px;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f5f7ff;
}

.upload-icon {
  width: 64px;
  height: 64px;
  color: #667eea;
  margin-bottom: 16px;
  opacity: 0.8;
}

.upload-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.upload-content p {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
}

.file-input {
  display: none;
}

.select-btn {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.select-btn:hover {
  background: #5568d3;
}

/* 已选择文件 */
.selected-files {
  margin-bottom: 24px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.file-icon {
  font-size: 32px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: #1a1a1a;
}

.file-size {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0 0;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #e8e8e8;
  color: #d32f2f;
}

/* 文档信息卡片 */
.document-info {
  margin-bottom: 32px;
}

.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: white;
  font-weight: 600;
  word-break: break-all;
}

.id-value {
  font-family: monospace;
  font-size: 11px;
}

/* 表单 */
.config-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin: 6px 0 0 0;
}

/* 处理中 */
.processing-area {
  text-align: center;
  padding: 80px 32px;
}

.spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 24px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.processing-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.processing-detail {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.progress-value {
  font-weight: 600;
  color: #667eea;
}

/* 预览统计 */
.preview-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

@media (max-width: 1200px) {
  .preview-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .preview-stats {
    grid-template-columns: 1fr;
  }
}

.stat-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
}

/* 分块列表 */
.chunks-list {
  margin-bottom: 32px;
  max-height: 400px;
  overflow-y: auto;
}

.chunk-item {
  margin-bottom: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.chunk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.chunk-index {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.chunk-size {
  font-size: 12px;
  color: #999;
}

.chunk-content {
  padding: 12px 16px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

/* 搜索框 */
.search-section {
  margin-bottom: 32px;
}

.search-params {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
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

.param-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.param-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.3s ease;
}

.param-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.param-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.param-hint {
  font-size: 11px;
  color: #999;
  margin: 0;
}

.checkbox-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 400;
  color: #1a1a1a;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-search {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-search:hover:not(:disabled) {
  background: #5568d3;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 检索结果 */
.retrieval-results {
  margin-bottom: 32px;
}

.retrieval-results h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.result-item {
  margin-bottom: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-index {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.result-chunk-id {
  font-size: 11px;
  color: #999;
  background: #e8e8e8;
  padding: 2px 6px;
  border-radius: 3px;
}

.result-score {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.result-content {
  padding: 12px 16px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  max-height: 100px;
  overflow-y: auto;
}

.result-footer {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  font-size: 11px;
  color: #999;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 按钮组 */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-cancel {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #1a1a1a;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover:not(:disabled) {
  background: #e8e8e8;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 确认对话框 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.confirm-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.dialog-close:hover {
  color: #666;
}

.dialog-body {
  padding: 32px 24px;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  margin: 0 0 16px 0;
}

.warning-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1a1a1a;
}

.warning-text {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.document-info-inline {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 16px;
  text-align: left;
  margin: 0;
}

.document-info-inline p {
  font-size: 13px;
  color: #555;
  margin: 8px 0;
  line-height: 1.5;
}

.document-info-inline p:first-child {
  margin-top: 0;
}

.document-info-inline p:last-child {
  margin-bottom: 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
}

.dialog-footer .btn-cancel,
.dialog-footer .btn-primary {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.dialog-footer .btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.dialog-footer .btn-cancel:hover:not(:disabled) {
  background: #e8e8e8;
}

.dialog-footer .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-footer .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dialog-footer .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.dialog-footer .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
