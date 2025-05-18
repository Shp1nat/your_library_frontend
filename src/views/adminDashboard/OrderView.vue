<template>
  <div class="orders-container">
    <h1 class="orders-title">Панель управления заказами</h1>
    <div class="orders-grid">
      <OrderCard label="Забронированные" icon="⏳" />
      <OrderCard label="Активные" icon="✅" />
      <OrderCard label="Завершенные и Отклоненные" icon="📁" />
    </div>
  </div>
</template>

<script>
// Import the new OrderCard component
import OrderCard from './OrderCard.vue'

export default {
  components: {
    OrderCard
  }
}
</script>

<style scoped>
.orders-container {
  padding: 40px;
  background: #f9fafb;
}

.orders-title {
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
  color: #1e3a8a;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}
</style>
