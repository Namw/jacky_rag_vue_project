<template>
  <Layout>
    <div class="home">
      <div class="welcome-section">
        <h1>欢迎使用 RAG 系统</h1>
        <p class="subtitle">开始您的文档分析和智能问答之旅</p>
      </div>

      <div class="user-info" v-if="user">
        <div class="info-card">
          <span class="info-label">当前用户</span>
          <span class="info-value">{{ user.username || '用户' }}</span>
        </div>
      </div>

      <div class="quick-links">
        <h2>快速开始</h2>
        <div class="links-grid">
          <router-link to="/document-chunking" class="link-card">
            <span class="icon">📄</span>
            <h3>文档分块</h3>
            <p>上传文档并配置分块参数</p>
          </router-link>
          <router-link to="/rag-qa" class="link-card">
            <span class="icon">💬</span>
            <h3>RAG问答</h3>
            <p>基于已上传文档的智能问答</p>
          </router-link>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import Layout from '@/components/Layout.vue'

const user = ref(null)

onMounted(async () => {
  try {
    user.value = await request.get('/api/auth/user')
  } catch (err) {
    console.error('Failed to fetch user:', err)
  }
})
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 48px;
  text-align: center;
}

.welcome-section h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.welcome-section .subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.user-info {
  margin-bottom: 48px;
}

.info-card {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.info-label {
  font-size: 14px;
  opacity: 0.9;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
}

.quick-links h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #1a1a1a;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.link-card:not(.disabled):hover {
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.link-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.link-card .icon {
  font-size: 48px;
}

.link-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.link-card p {
  font-size: 13px;
  color: #999;
  margin: 0;
  text-align: center;
}
</style>