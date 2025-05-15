<template>
  <component :is="currentComponent" />
</template>

<script>
import userOrders from '@/views/userDashboard/OrdersView.vue'
import adminOrders from '@/views/adminDashboard/OrderView.vue'

export default {
  computed: {
    currentComponent() {
      const isAdmin = localStorage.getItem('status') === 'admin'
      return isAdmin ? adminOrders : userOrders
    }
  }
}
</script>
