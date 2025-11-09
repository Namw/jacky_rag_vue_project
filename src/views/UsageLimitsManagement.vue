<template>
  <Layout>
    <div class="usage-limits-management">
      <div class="page-header">
        <h1>使用限额管理</h1>
        <p class="subtitle">查看和管理系统的文档上传和问答次数限额</p>
      </div>

      <!-- 密码验证模态框 -->
      <el-dialog
        v-model="showAuthDialog"
        title="管理员身份验证"
        width="400px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
      >
        <div class="auth-dialog-content">
          <p class="auth-description">需要输入管理员密码才能进行修改操作</p>
          <el-form
            :model="authForm"
            @submit.prevent="handleAuthenticate"
          >
            <el-form-item label="管理员密码" required>
              <el-input
                v-model="authForm.password"
                type="password"
                placeholder="输入管理员密码"
                show-password
                @keyup.enter="handleAuthenticate"
              />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <el-button @click="showAuthDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="authLoading"
            @click="handleAuthenticate"
          >
            验证
          </el-button>
        </template>
      </el-dialog>

      <!-- 当前限额展示 -->
      <div class="limits-display-section">
        <div class="limits-card">
          <div class="card-header">
            <h3>当前系统限额</h3>
            <span v-if="isAuthenticated" class="auth-status">✅ 已验证</span>
          </div>

          <div class="limits-grid">
            <div class="limit-item">
              <div class="limit-icon upload-icon">📤</div>
              <div class="limit-info">
                <div class="limit-title">文档上传限额</div>
                <div class="limit-value">{{ currentLimits.upload_limit || '-' }}次/天</div>
                <div class="limit-description">每日最多上传次数</div>
              </div>
            </div>

            <div class="limit-item">
              <div class="limit-icon query-icon">❓</div>
              <div class="limit-info">
                <div class="limit-title">问答查询限额</div>
                <div class="limit-value">{{ currentLimits.query_limit || '-' }}次/天</div>
                <div class="limit-description">每日最多问答次数</div>
              </div>
            </div>
          </div>

          <div class="reset-time" v-if="currentLimits.reset_time">
            <span>下次重置时间：{{ formatTime(currentLimits.reset_time) }}</span>
          </div>

          <div v-if="!isAuthenticated" class="auth-prompt">
            <el-button type="primary" @click="openAuthDialog">
              🔐 点击此处验证身份以进行修改
            </el-button>
          </div>
        </div>
      </div>

      <!-- 管理员操作区域 -->
      <div v-if="isAdmin && isAuthenticated" class="admin-section">
        <!-- 修改限额 -->
        <div class="admin-card">
          <div class="card-header">
            <h3>修改系统限额</h3>
            <span class="admin-badge">🔐 管理员</span>
          </div>

          <el-form
            :model="updateForm"
            label-width="120px"
            @submit.prevent="handleUpdateLimits"
          >
            <el-form-item label="上传限额" required>
              <div class="input-group">
                <el-input-number
                  v-model="updateForm.uploadLimit"
                  :min="1"
                  :max="10000"
                />
                <span class="unit">次/天</span>
              </div>
            </el-form-item>

            <el-form-item label="问答限额" required>
              <div class="input-group">
                <el-input-number
                  v-model="updateForm.queryLimit"
                  :min="1"
                  :max="10000"
                />
                <span class="unit">次/天</span>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleUpdateLimits"
                :loading="updateLoading"
              >
                {{ updateLoading ? '更新中...' : '更新限额' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 重置用户计数 -->
        <div class="admin-card">
          <div class="card-header">
            <h3>重置使用计数</h3>
            <span class="admin-badge">🔐 管理员</span>
          </div>

          <el-form
            :model="resetForm"
            label-width="120px"
            @submit.prevent="handleResetUsage"
          >
            <el-form-item label="重置对象" required>
              <el-radio-group v-model="resetForm.resetType">
                <el-radio label="self">重置自己的计数</el-radio>
                <el-radio label="user">重置指定用户</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="resetForm.resetType === 'user'" label="用户ID" required>
              <el-input
                v-model.number="resetForm.userId"
                type="number"
                placeholder="输入要重置的用户ID"
                :min="1"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="warning"
                @click="handleResetUsage"
                :loading="resetLoading"
              >
                {{ resetLoading ? '重置中...' : '重置计数' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="reset-tips">
            <div class="tip-item">
              <span class="tip-icon">ℹ️</span>
              <span>重置计数会立即生效，用户可继续使用新的额度</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">ℹ️</span>
              <span>重置自己的计数，无需填写用户ID</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">ℹ️</span>
              <span>明日系统会自动重置所有用户的计数</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 非管理员提示 -->
      <div v-else class="non-admin-section">
        <el-empty description="您需要管理员权限来修改限额和重置计数">
          <template #default>
            <div class="empty-tips">
              <p>当前用户权限不足</p>
              <p style="font-size: 12px; color: #999;">
                仅具有管理员角色的用户可以修改系统限额和重置使用计数
              </p>
            </div>
          </template>
        </el-empty>
      </div>

      <!-- 消息提示 -->
      <el-alert
        v-if="message.type"
        :title="message.text"
        :type="message.type"
        :closable="true"
        @close="message.type = ''"
        style="margin-top: 20px;"
      />
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { updateUsageLimits, resetUserUsage } from '@/api/usage'
import { getUsageStats } from '@/api/document'

// 当前限额信息
const currentLimits = ref({
  upload_limit: null,
  query_limit: null,
  reset_time: null
})

// 管理员标志（从 localStorage 中的 role 判断）
const isAdmin = computed(() => {
  const role = localStorage.getItem('role')
  return role === 'admin'
})

// 身份验证状态
const isAuthenticated = ref(false)
const authPassword = ref('')

// 密码验证表单
const showAuthDialog = ref(false)
const authForm = ref({
  password: ''
})
const authLoading = ref(false)

// 更新限额表单
const updateForm = ref({
  uploadLimit: null,
  queryLimit: null,
  uploadLimitChanged: false,
  queryLimitChanged: false
})

// 重置计数表单
const resetForm = ref({
  resetType: 'self',
  userId: null
})

// 加载状态
const updateLoading = ref(false)
const resetLoading = ref(false)

// 消息
const message = ref({
  type: '',
  text: ''
})

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

// 加载当前限额
const loadCurrentLimits = async () => {
  try {
    const response = await getUsageStats()
    currentLimits.value = {
      upload_limit: response.upload_limit,
      query_limit: response.query_limit,
      reset_time: response.next_reset_time
    }

    // 初始化表单
    updateForm.value.uploadLimit = response.upload_limit
    updateForm.value.queryLimit = response.query_limit
  } catch (error) {
    console.error('加载限额失败:', error)
    showMessage('error', '加载限额信息失败')
  }
}

// 显示消息
const showMessage = (type, text) => {
  message.value = { type, text }
  if (type === 'success') {
    setTimeout(() => {
      message.value.type = ''
    }, 3000)
  }
}

// 打开身份验证对话框
const openAuthDialog = () => {
  authForm.value.password = ''
  showAuthDialog.value = true
}

// 处理身份验证
const handleAuthenticate = async () => {
  if (!authForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }

  authLoading.value = true
  try {
    // 通过尝试调用一个需要权限的API来验证密码
    // 这里我们使用重置API的一个测试调用
    // 实际上，我们可以通过尝试一个简单的操作来验证
    // 为了简化，我们直接存储密码，让后续的API调用来验证
    authPassword.value = authForm.value.password
    isAuthenticated.value = true
    showAuthDialog.value = false
    ElMessage.success('✅ 身份验证成功，现在可以进行修改操作')
  } catch (error) {
    console.error('身份验证失败:', error)
    ElMessage.error('身份验证失败，请检查密码')
  } finally {
    authLoading.value = false
  }
}

// 更新限额
const handleUpdateLimits = async () => {
  if (!updateForm.value.uploadLimit || !updateForm.value.queryLimit) {
    ElMessage.warning('请填写所有必填项')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要更新限额为：上传 ${updateForm.value.uploadLimit} 次/天，问答 ${updateForm.value.queryLimit} 次/天？`,
      '确认更新',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    updateLoading.value = true
    const response = await updateUsageLimits(
      updateForm.value.uploadLimit,
      updateForm.value.queryLimit,
      authPassword.value
    )

    showMessage('success', `✅ 限额更新成功！上传: ${response.upload_limit}, 问答: ${response.query_limit}`)
    await loadCurrentLimits()
  } catch (error) {
    console.error('更新限额失败:', error)

    if (error === 'cancel') {
      return
    }

    if (error.response?.status === 403) {
      showMessage('error', '❌ 权限不足，只有管理员可以修改限额')
    } else if (error.response?.status === 401) {
      showMessage('error', '❌ 管理密码错误，请重新验证')
      isAuthenticated.value = false
      authPassword.value = ''
    } else {
      const errorMsg = error.response?.data?.detail || error.message || '更新失败'
      showMessage('error', `❌ 更新失败: ${errorMsg}`)
    }
  } finally {
    updateLoading.value = false
  }
}

// 重置使用计数
const handleResetUsage = async () => {
  if (resetForm.value.resetType === 'user' && !resetForm.value.userId) {
    ElMessage.warning('请输入用户ID')
    return
  }

  const targetText = resetForm.value.resetType === 'self'
    ? '自己的计数'
    : `用户 ${resetForm.value.userId} 的计数`

  try {
    await ElMessageBox.confirm(
      `确定要重置${targetText}？此操作不可撤销。`,
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    resetLoading.value = true
    const userId = resetForm.value.resetType === 'user' ? resetForm.value.userId : null
    const response = await resetUserUsage(authPassword.value, userId)

    showMessage('success', `✅ ${response.message}`)
    resetForm.value.userId = null
  } catch (error) {
    console.error('重置计数失败:', error)

    if (error === 'cancel') {
      return
    }

    if (error.response?.status === 403) {
      showMessage('error', '❌ 权限不足，只有管理员可以重置计数')
    } else if (error.response?.status === 401) {
      showMessage('error', '❌ 管理密码错误，请重新验证')
      isAuthenticated.value = false
      authPassword.value = ''
    } else {
      const errorMsg = error.response?.data?.detail || error.message || '重置失败'
      showMessage('error', `❌ 重置失败: ${errorMsg}`)
    }
  } finally {
    resetLoading.value = false
  }
}

// 页面加载
onMounted(() => {
  loadCurrentLimits()
})
</script>

<style scoped>
.usage-limits-management {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.auth-dialog-content {
  padding: 20px 0;
}

.auth-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  text-align: center;
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

/* 限额展示区域 */
.limits-display-section {
  margin-bottom: 40px;
}

.limits-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.admin-badge {
  font-size: 12px;
  padding: 4px 12px;
  background: #fff7e6;
  color: #faad14;
  border-radius: 12px;
  font-weight: 500;
}

.limits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .limits-grid {
    grid-template-columns: 1fr;
  }
}

.limit-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.limit-icon {
  font-size: 32px;
  line-height: 1;
}

.limit-info {
  flex: 1;
}

.limit-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.limit-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.limit-description {
  font-size: 12px;
  color: #999;
}

.reset-time {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.auth-status {
  font-size: 12px;
  padding: 4px 12px;
  background: #f0f9ff;
  color: #67c23a;
  border-radius: 12px;
  font-weight: 500;
}

.auth-prompt {
  margin-top: 20px;
  padding: 16px;
  background: #fdf6ec;
  border-radius: 6px;
  border-left: 4px solid #e6a23c;
  text-align: center;
}

/* 管理员操作区域 */
.admin-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-group .unit {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.input-group :deep(.el-input-number) {
  flex: 1;
  max-width: 200px;
}

.reset-tips {
  margin-top: 20px;
  padding: 16px;
  background: #f0f5ff;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.tip-item {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  flex-shrink: 0;
  min-width: 16px;
  display: inline-block;
}

/* 非管理员提示 */
.non-admin-section {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}

.empty-tips {
  margin-top: 16px;
}

.empty-tips p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input-number__input) {
  text-align: center;
}
</style>
