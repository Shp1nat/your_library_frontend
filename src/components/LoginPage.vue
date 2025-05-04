<template>
  <div class="login-container">
    <div class="login-header">
      <img src="@/assets/yourLibraryLogo.png" alt="Logo" class="logo" />
      <h2 class="brand-title">YourLibrary</h2>
    </div>
    <div class="login-box">
      <h1>Вход</h1>
      <input v-model="username" placeholder="Логин" class="input-field" />
      <input v-model="password" placeholder="Пароль" type="password" class="input-field" />
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <button @click="login" class="submit-button">Войти</button>
      <router-link to="/register" class="register-link">Нет аккаунта? Зарегистрироваться</router-link>
    </div>
  </div>
  <div v-if="showRoleModal" class="modal-overlay">
    <div class="modal">
      <h3>Выберите способ входа</h3>
      <button @click="setRole('admin')" class="modal-button admin">Войти как администратор</button>
      <button @click="setRole('user')" class="modal-button user">Войти как пользователь</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      showRoleModal: false,
      tempToken: '',
    }
  },
  methods: {
    async login() {
      this.errorMessage = '';
      try {
        const response = await fetch('http://localhost:3000/proxy/sign-in-user.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: {login: this.username, password: this.password} }),
        })
        const data = await response.json()
        if (data.error) {
          this.errorMessage = data.error;
        } else if (data.result.status === 'admin') {
          this.tempToken = data.result.accessToken;
          this.showRoleModal = true;
        } else {
          localStorage.setItem('token', data.result.accessToken)
          localStorage.setItem('status', data.result.status)
          this.$router.push('/profile')
        }
      } catch (err) {
        console.error('Login error:', err)
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    setRole(role) {
      localStorage.setItem('token', this.tempToken)
      localStorage.setItem('status', role)
      this.showRoleModal = false
      this.$router.push('/profile')
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@700&display=swap');

.error-message {
  background-color: #ffe0e0;
  color: #8b0000;
  padding: 10px;
  border: 1px solid #ffb3b3;
  border-radius: 5px;
  margin: 10px 0;
  font-weight: bold;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  background: #f4f4f9;
  padding-top: 40px;
}

.login-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.logo {
  height: 50px;
  margin-right: 15px;
}

.brand-title {
  font-family: 'Merriweather Sans', sans-serif;
  font-size: 2rem;
  color: #1e3a8a;
}

.login-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 350px;
  text-align: center;
}

h1 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 20px;
}

.input-field {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  border-color: #1e3a8a;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background-color: #1e3a8a;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #1e2a47;
}

.register-link {
  display: block;
  margin-top: 15px;
  color: #1e3a8a;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(2px);
}

.modal {
  background: #ffffff;
  padding: 30px 40px;
  border-radius: 12px;
  width: 380px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: fadeInModal 0.3s ease-out;
}

.modal h3 {
  font-size: 1.4rem;
  color: #1f2937;
  margin-bottom: 25px;
}

.modal-button {
  display: block;
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  color: #fff;
  transition: all 0.25s ease-in-out;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.modal-button.admin {
  background-color: #1e3a8a;
}

.modal-button.admin:hover {
  background-color: #172b65;
  transform: scale(1.02);
}

.modal-button.user {
  background-color: #2d6a4f;
}

.modal-button.user:hover {
  background-color: #1e4736;
  transform: scale(1.02);
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
