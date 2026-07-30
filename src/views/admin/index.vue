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
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.admin-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  min-height: calc(100vh - 200px);
}
</style>
