<template>
  <component :is="currentComponent" />
</template>

<script>
import userProfile from '@/views/userDashboard/ProfileView.vue'
import adminProfile from '@/views/adminDashboard/ProfileView.vue'

export default {
  computed: {
    currentComponent() {
      const isAdmin = localStorage.getItem('status') === 'admin'
      return isAdmin ? adminProfile : userProfile
    }
  }
}
</script>
