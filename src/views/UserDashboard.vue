<template>
  <div class="dashboard">
    <aside class="sidebar">
      <img src="@/assets/yourLibraryLogo.png" alt="Logo" class="logo" />
      <nav class="menu">
        <router-link to="/userDashboard/profile">Профиль</router-link>
        <router-link to="/userDashboard/books">Книги</router-link>
        <router-link to="/userDashboard/orders">Заказы</router-link>
        <router-link to="/userDashboard/vacancies">Вакансии</router-link>
      </nav>
      <button @click="logout" class="logout-button">Выход из аккаунта</button>
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
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  background-color: #f4f4f9;
}

.sidebar {
  width: 240px;
  background-color: #1e3a8a; /* темно-синий фон */
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.logo {
  width: 160px;
  margin-bottom: 40px;
}

.menu {
  width: 100%;
  flex-grow: 1;
}

.menu a {
  display: block;
  margin: 12px 0;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
  color: #ffffff;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.menu a.router-link-exact-active {
  background-color: #2c5282;
}

.menu a:hover {
  background-color: #3b5998;
}

.logout-button {
  width: 100%;
  padding: 12px;
  background-color: #ffffff;
  color: #1e3a8a;
  border: 2px solid #1e3a8a;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: #ff4d4f;
  color: #ffffff;
  border-color: #ff4d4f;
  transform: scale(1.05);
}

.content {
  margin-left: 240px;
  flex-grow: 1;
  padding: 40px;
  overflow-y: auto;
  height: 100vh;
  background-color: #f4f4f9;
}
</style>
