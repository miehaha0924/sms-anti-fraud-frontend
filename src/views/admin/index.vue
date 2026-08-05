<template>
  <div class="admin-layout">
    <div class="admin-header">
      <h2>管理面板</h2>
    </div>
    <div class="admin-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-layout {
  height: 100%;
}

.admin-header {
  margin-bottom: 24px;
}

.admin-header h2 {
  font-size: 36px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.admin-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  min-height: calc(100vh - 200px);
}
</style>
