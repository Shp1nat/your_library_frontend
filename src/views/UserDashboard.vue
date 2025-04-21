<template>
  <div class="dashboard">
    <aside class="sidebar">
      <img src="@/assets/yourLibraryLogo.png" alt="Logo" class="logo" />
      <nav class="menu">
        <router-link to="/dashboard/profile">Профиль</router-link>
        <router-link to="/dashboard/books">Книги</router-link>
        <router-link to="/dashboard/orders">Заказы</router-link>
        <router-link to="/dashboard/vacancies">Вакансии</router-link>
      </nav>
      <button @click="logout" class="logout-button">Выход</button>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #f0f0f0;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.logo {
  display: block;
  width: 100%;
  max-width: 160px;
  margin: 0 auto 30px auto;
}

.menu a {
  display: block;
  margin: 15px 0;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

.menu a.router-link-exact-active {
  color: #42b983;
}

.logout-button {
  padding: 10px 20px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

.logout-button:hover {
  background-color: #ff7875;
}

.content {
  flex-grow: 1;
  padding: 30px;
}
</style>
