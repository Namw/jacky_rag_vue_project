import request from '@/utils/request'

/**
 * 上传 PDF 文档
 * @param {File} file - PDF 文件对象
 * @returns {Promise<Object>} 返回文档信息
 */
export const uploadDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  return await request.post('/api/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取文档列表
 * @returns {Promise<Array>} 返回文档列表
 */
export const getDocuments = async () => {
  return await request.get('/api/documents')
}

/**
 * 删除文档（旧 API）
 * @param {string} documentId - 文档 ID
 * @returns {Promise<Object>} 返回删除结果
 */
export const deleteDocument = async (documentId) => {
  return await request.delete(`/api/documents/${documentId}`)
}

/**
 * 删除集合（从文档库）
 * @param {string} documentId - 文档 ID
 * @returns {Promise<Object>} 返回删除结果，包含删除信息和统计
 */
export const deleteCollection = async (documentId) => {
  return await request.delete('/api/collections/delete', {
    data: { document_id: documentId }
  })
}

/**
 * 获取文档详情
 * @param {string} documentId - 文档 ID
 * @returns {Promise<Object>} 返回文档详情
 */
export const getDocumentDetail = async (documentId) => {
  return await request.get(`/api/documents/${documentId}`)
}

/**
 * 对文档进行智能分块
 * @param {string} documentId - 文档 ID
 * @param {Object} config - 分块配置
 * @param {number} config.chunk_size - 分块大小（字符数），范围 100-2000，默认 500
 * @param {number} config.overlap - 重叠字符数，范围 0-500，默认 50
 * @param {string} config.separator - 分隔符，默认 "\n\n"
 * @returns {Promise<Object>} 返回分块结果
 */
export const chunkDocument = async (documentId, config = {}) => {
  const defaultConfig = {
    chunk_size: 500,
    overlap: 50,
    separator: '\n\n',
    ...config
  }

  return await request.post(`/api/documents/${documentId}/chunk`, defaultConfig)
}

/**
 * 对分块进行向量化
 * @param {string} documentId - 文档 ID
 * @returns {Promise<Object>} 返回向量化结果
 */
export const vectorizeDocument = async (documentId) => {
  return await request.post(`/api/documents/${documentId}/vectorize`)
}

/**
 * 检索文档（召回测试）
 * @param {string} documentId - 文档 ID
 * @param {string} query - 搜索问题
 * @param {number} topK - 返回最相关的 K 个结果，范围 1-20，默认 5
 * @param {number} threshold - 相似度阈值，范围 0.0-1.0，可选
 * @param {boolean} useRerank - 是否使用二次精排，默认 false
 * @returns {Promise<Object>} 返回检索结果
 */
export const searchDocument = async (documentId, query, topK = 5, threshold = null, useRerank = false) => {
  const payload = {
    query: query,
    top_k: topK,
    use_rerank: useRerank
  }

  // 只有当 threshold 被显式指定且不为 null 时才添加
  if (threshold !== null && threshold !== undefined) {
    payload.threshold = threshold
  }

  return await request.post(`/api/documents/${documentId}/search`, payload)
}

/**
 * 确认入库（将临时向量数据迁移到正式库永久保存）
 * @param {string} documentId - 文档 ID
 * @returns {Promise<Object>} 返回入库结果
 */
export const confirmDocument = async (documentId) => {
  return await request.post(`/api/documents/${documentId}/confirm`)
}

/**
 * 查看已确认入库的文档内容
 * @param {string} documentId - 文档 ID
 * @param {number} page - 页码，默认 1
 * @param {number} pageSize - 每页数量，默认 10，范围 1-100
 * @returns {Promise<Object>} 返回分页的文档内容
 */
export const getPermanentDocument = async (documentId, page = 1, pageSize = 10) => {
  return await request.get(`/api/documents/${documentId}/permanent`, {
    params: { page, page_size: pageSize }
  })
}

/**
 * 获取所有已入库的文档列表
 * @returns {Promise<Array>} 返回已入库文档列表
 */
export const listDocuments = async () => {
  return await request.get('/api/documents')
}

/**
 * 获取集合列表
 * @returns {Promise<Object>} 返回集合列表，包含 total、collections 和 timestamp
 */
export const getCollectionsList = async () => {
  return await request.get('/api/collections/list')
}

/**
 * 获取集合详情（分页获取文本块）
 * @param {string} documentId - 文档 ID
 * @param {number} page - 页码，默认 1
 * @param {number} pageSize - 每页数量，默认 10，范围 1-50
 * @returns {Promise<Object>} 返回集合详情，包含分块列表和分页信息
 */
export const getCollectionDetail = async (documentId, page = 1, pageSize = 10) => {
  return await request.get(`/api/collections/detail/${documentId}`, {
    params: { page, page_size: pageSize }
  })
}
