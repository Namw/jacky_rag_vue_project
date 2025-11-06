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
 * @param {number} topK - 检索文档数量，默认 5
 * @param {boolean} returnSources - 是否返回来源，默认 true
 * @param {Object} filterDict - 元数据过滤条件，可选
 * @param {string} systemPrompt - 自定义系统提示词，可选
 * @returns {Promise<Object>} 返回问答结果
 */
export const queryRag = async (question, topK = 5, returnSources = true, filterDict = null, systemPrompt = null) => {
  const payload = {
    question,
    top_k: topK,
    return_sources: returnSources
  }

  if (filterDict !== null && filterDict !== undefined) {
    payload.filter_dict = filterDict
  }

  if (systemPrompt !== null && systemPrompt !== undefined) {
    payload.system_prompt = systemPrompt
  }

  return await request.post('/api/chat/query', payload)
}
