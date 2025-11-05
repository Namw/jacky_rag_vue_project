import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Home from '@/views/Home.vue'
import DocumentChunking from '@/views/DocumentChunking.vue'
import RagQA from '@/views/RagQA.vue'
import PermanentDocumentView from '@/views/PermanentDocumentView.vue'
import DocumentLibrary from '@/views/DocumentLibrary.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/document-chunking', component: DocumentChunking, meta: { requiresAuth: true } },
  { path: '/rag-qa', component: RagQA, meta: { requiresAuth: true } },
  { path: '/document-library', component: DocumentLibrary, meta: { requiresAuth: true } },
  { path: '/permanent-document/:documentId', name: 'PermanentDocument', component: PermanentDocumentView, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router