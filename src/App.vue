<template>
  <div id="app">
    <main class="app-main">
      <router-view />
    </main>
  </div>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout.vue'

export default {
  computed: {
    layout() {
      const layoutType = this.$route.meta.layout
      return layoutType === 'dashboard' ? DashboardLayout : 'div'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body, html {
  height: 100%;
  overflow: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  overflow: hidden;
  background: #f4f4f9;
}
</style>
