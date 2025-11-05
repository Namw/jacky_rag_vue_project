<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码"
            @keyup.enter="login" 
          />
        </el-form-item>
        <el-button type="primary" @click="login" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = ref({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const login = async () => {
  await formRef.value.validate()
  loading.value = true
  
  try {
    const formData = new FormData()
    formData.append('username', form.value.username)
    formData.append('password', form.value.password)
    
    const res = await request.post('/api/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    localStorage.setItem('token', res.access_token)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #e2e8f0;
  font-weight: 600;
  font-size: 26px;
}

:deep(.el-form-item__label) {
  color: #cbd5e1 !important;
}

:deep(.el-input__wrapper) {
  background-color: rgba(51, 65, 85, 0.5);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.el-input__inner) {
  color: #e2e8f0;
}

:deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}

:deep(.el-input__wrapper:hover) {
  background-color: rgba(51, 65, 85, 0.7);
}

:deep(.el-input__wrapper.is-focus) {
  background-color: rgba(51, 65, 85, 0.8);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(99, 102, 241, 0.3);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  border: none;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.5);
  background: linear-gradient(135deg, #0891b2, #0e7490);
}
</style>