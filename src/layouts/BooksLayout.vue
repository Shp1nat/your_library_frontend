<template>
  <component :is="currentComponent" />
</template>

<script>
import userBooks from '@/views/userDashboard/BooksView.vue'
import adminBooks from '@/views/adminDashboard/BooksView.vue'

export default {
  computed: {
    currentComponent() {
      const isAdmin = localStorage.getItem('status') === 'admin'
      return isAdmin ? adminBooks : userBooks
    }
  }
}
</script>
