<template>
  <div class="dashboard">
    <aside class="sidebar">
      <router-link to="/dashboard/profile">Профиль</router-link>
      <router-link to="/dashboard/books">Книги</router-link>
      <router-link to="/dashboard/orders">Заказы</router-link>
      <router-link to="/dashboard/vacancies">Вакансии</router-link>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
}

.sidebar {
  width: 200px;
  background: #f0f0f0;
  padding: 20px;
  min-height: 100vh;
}

.sidebar a {
  display: block;
  margin: 10px 0;
  font-weight: bold;
  color: #333;
}

.content {
  flex-grow: 1;
  padding: 20px;
}
</style>
