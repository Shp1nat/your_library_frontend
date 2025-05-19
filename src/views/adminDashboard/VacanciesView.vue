<template>
  <div class="vacancies-home-container">
    <h1 class="page-title">Управление вакансиями</h1>
    <div class="cards-container">
      <VacancyCard label="Ожидание" icon="⏳" status="waiting"/>
      <VacancyCard label="Принято" icon="✅" status="accepted"/>
      <VacancyCard label="Отклонено" icon="❌" status="rejected"/>
    </div>
  </div>
</template>

<script>
import VacancyCard from './VacanciesCard.vue';

export default {
  name: 'VacanciesHome',
  components: {
    VacancyCard
  }
}
</script>

<style scoped>
.vacancies-home-container {
  padding: 2rem;
  font-family: sans-serif;
  text-align: center;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 2rem;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
</style>