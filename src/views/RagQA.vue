<template>
  <Layout>
    <div class="rag-qa">
      <div class="page-header">
        <h1>RAG 问答系统</h1>
        <p class="subtitle">基于已上传文档的智能问答</p>
      </div>

      <div class="coming-soon">
        <span class="icon">🚧</span>
        <h2>功能开发中</h2>
        <p>RAG问答功能即将上线，敬请期待</p>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/components/Layout.vue'
</script>

<style scoped>
.rag-qa {
  max-width: 1200px;
  margin: 0 auto;
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

.coming-soon {
  background: white;
  border-radius: 8px;
  padding: 80px 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.coming-soon .icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.coming-soon h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.coming-soon p {
  font-size: 14px;
  color: #666;
  margin: 0;
}
</style>
