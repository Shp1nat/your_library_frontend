<template>
  <div class="card" @click="goToPage">
    <div class="icon">{{ icon }}</div>
    <div class="label">{{ label }}</div>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    icon: String
  },
  methods: {
    goToPage() {
      const pathMap = {
        'Забронированные': '/orders/booked',
        'Активные': '/orders/active',
        'Завершенные и Отклоненные': '/orders/closed-rejected'
      }
      this.$router.push(pathMap[this.label] || '/admin/orders')
    }
  }
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #374151;
}
</style>
