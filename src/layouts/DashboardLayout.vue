<template>
  <component :is="layoutComponent" />
</template>

<script>
import UserDashboard from '../views/UserDashboard.vue';
import AdminDashboard from '../views/AdminDashboard.vue';

export default {
  computed: {
    layoutComponent() {
      const isAdmin = localStorage.getItem('status') === 'admin';
      return isAdmin ? AdminDashboard : UserDashboard;
    }
  }
};
</script>
