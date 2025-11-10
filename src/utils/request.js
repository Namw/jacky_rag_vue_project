import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000
})

// 请求拦截：添加token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：处理错误
request.interceptors.response.use(
  response => response.data,
  error => {
    // 管理员密码错误（401）不需要退出系统，由业务层处理
    const isAdminPasswordError = error.config?.url?.includes('/api/usage/limits/update') ||
                                  error.config?.url?.includes('/api/usage/reset')

    if (error.response?.status === 401 && !isAdminPasswordError) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    ElMessage.error(error.response?.data?.detail || '请求失败')
    return Promise.reject(error)
  }
)

export default request