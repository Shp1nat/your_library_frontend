<template>
  <component :is="currentComponent" />
</template>

<script>
import profile from '@/views/commonDashboard/ProfileView.vue'

export default {
  computed: {
    currentComponent() {
      return profile
    }
  }
}
</script>
