<template>
  <div class="layout">
    <Sidebar />
    <div class="content-wrapper">
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  width: 100%;
}

.content-wrapper {
  margin-left: 240px;
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
}

.content {
  min-height: 100vh;
  padding: 32px;
}
</style>
