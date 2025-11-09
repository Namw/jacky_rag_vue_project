<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>RAG 系统</h2>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="nav-section-title">处理</div>
        <router-link
          to="/document-chunking"
          class="nav-item"
          :class="{ active: isActive('/document-chunking') }"
        >
          <span class="icon">📄</span>
          <span class="text">文档分块</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-section-title">应用</div>
        <router-link
          to="/rag-qa"
          class="nav-item"
          :class="{ active: isActive('/rag-qa') }"
        >
          <span class="icon">💬</span>
          <span class="text">RAG问答</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-section-title">正式库</div>
        <button
          @click="showDocumentLibrary"
          class="nav-item nav-button"
          :class="{ active: isActive('/document-library') }"
        >
          <span class="icon">📚</span>
          <span class="text">文档库</span>
        </button>
      </div>

      <div class="nav-section">
        <div class="nav-section-title">设置</div>
        <router-link
          to="/usage-limits"
          class="nav-item"
          :class="{ active: isActive('/usage-limits') }"
        >
          <span class="icon">⚙️</span>
          <span class="text">使用限额管理</span>
        </router-link>
      </div>
    </nav>
    <div class="sidebar-footer">
      <button @click="logout" class="logout-btn">
        <span class="icon">🚪</span>
        <span class="text">退出登录</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path)
}

const showDocumentLibrary = () => {
  router.push('/document-library')
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  padding: 8px 16px 4px 16px;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-left-color: rgba(255, 255, 255, 0.5);
}

.nav-item.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border-left-color: white;
  font-weight: 500;
}

.nav-item .icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
}

.nav-item .text {
  font-size: 14px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.logout-btn .icon {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
