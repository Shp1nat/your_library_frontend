<template>
  <component :is="currentComponent" />
</template>

<script>
import userVacancies from '@/views/userDashboard/VacanciesView.vue'
import adminVacancies from '@/views/adminDashboard/VacanciesView.vue'

export default {
  computed: {
    currentComponent() {
      const isAdmin = localStorage.getItem('status') === 'admin'
      return isAdmin ? adminVacancies : userVacancies
    }
  }
}
</script>
