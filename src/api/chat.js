import request from '@/utils/request'

/**
 * 获取模型信息
 * @returns {Promise<Object>} 返回模型信息
 */
export const getModelInfo = async () => {
  return await request.get('/api/chat/model-info')
}

/**
 * 切换模型
 * @param {string} provider - 模型名称 (deepseek/qwen)
 * @param {number} temperature - 温度 (0.0-2.0)，可选
 * @returns {Promise<Object>} 返回切换结果
 */
export const switchModel = async (provider, temperature = null) => {
  const payload = { provider }
  if (temperature !== null && temperature !== undefined) {
    payload.temperature = temperature
  }
  return await request.post('/api/chat/switch-model', payload)
}

/**
 * RAG 问答查询
 * @param {string} question - 用户问题
 * @param {number} topK - 检索文档数量，默认 5，范围 1-20
 * @param {boolean} returnSources - 是否返回来源，默认 true
 * @param {Object} filterDict - 元数据过滤条件，可选（已弃用）
 * @param {string} systemPrompt - 自定义系统提示词，可选
 * @param {boolean} useRerank - 是否启用二次精排，默认 false
 * @param {string} documentId - 指定文档ID，为空则检索所有文档，可选
 * @param {number} threshold - 相似度阈值，范围 0.0-1.0，可选
 * @returns {Promise<Object>} 返回问答结果，包括 answer、sources、timestamp、model_provider
 */
export const queryRag = async (
  question,
  topK = 5,
  returnSources = true,
  filterDict = null,
  systemPrompt = null,
  useRerank = false,
  documentId = null,
  threshold = null
) => {
  const payload = {
    question,
    top_k: topK,
    return_sources: returnSources,
    use_rerank: useRerank
  }

  // 添加文档ID，如果指定
  if (documentId !== null && documentId !== undefined) {
    payload.document_id = documentId
  }

  // 添加系统提示词，如果指定
  if (systemPrompt !== null && systemPrompt !== undefined) {
    payload.system_prompt = systemPrompt
  }

  // 添加相似度阈值，如果指定
  if (threshold !== null && threshold !== undefined) {
    payload.threshold = threshold
  }

  return await request.post('/api/chat/query', payload)
}

/**
 * 获取缓存统计
 * @returns {Promise<Object>} 返回缓存统计信息
 */
export const getCacheStats = async () => {
  return await request.get('/api/chat/cache/stats')
}

/**
 * 清空缓存
 * @param {string} documentId - 文档ID，不传则清空所有缓存
 * @returns {Promise<Object>} 返回清空结果
 */
export const clearCache = async (documentId = null) => {
  const params = {}
  if (documentId !== null && documentId !== undefined) {
    params.document_id = documentId
  }
  return await request.delete('/api/chat/cache/clear', { params })
}
