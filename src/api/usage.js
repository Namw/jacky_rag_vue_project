import request from '@/utils/request'

/**
 * 更新全局上传和问答限额
 * @param {number} uploadLimit - 新的上传限额
 * @param {number} queryLimit - 新的问答限额
 * @param {string} adminPassword - 管理员密码
 * @returns {Promise<Object>} 返回更新结果
 */
export const updateUsageLimits = async (uploadLimit, queryLimit, adminPassword) => {
  return await request.post('/api/usage/limits/update', {
    admin_password: adminPassword,
    upload_limit: uploadLimit,
    query_limit: queryLimit
  })
}

/**
 * 重置用户的今日使用计数
 * @param {string} adminPassword - 管理员密码
 * @param {number} userId - 要重置的用户ID，不提供则重置自己
 * @returns {Promise<Object>} 返回重置结果
 */
export const resetUserUsage = async (adminPassword, userId = null) => {
  const payload = {
    admin_password: adminPassword
  }

  if (userId !== null && userId !== undefined) {
    payload.user_id = userId
  }

  return await request.post('/api/usage/reset', payload)
}
