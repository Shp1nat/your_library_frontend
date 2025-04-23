<template>
  <div class="register-container">
    <div class="register-header">
      <img src="@/assets/yourLibraryLogo.png" alt="Logo" class="logo" />
      <h2 class="brand-title">YourLibrary</h2>
    </div>
    <div class="register-box">
      <h1>Регистрация</h1>
      <input v-model="username" placeholder="Логин" class="input-field" />
      <input v-model="password" placeholder="Пароль" type="password" class="input-field" />
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <button @click="register" class="submit-button">Зарегистрироваться</button>
      <router-link to="/login" class="login-link">Уже есть аккаунт? Войти</router-link>
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
      successMessage: '',
    }
  },
  methods: {
    async register() {
      this.errorMessage = '';
      this.successMessage = '';
      try {
        const response = await fetch('http://localhost:3000/proxy/sign-up-user.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: { login: this.username, password: this.password } }),
        });
        const data = await response.json();
        if (data.error)
          this.errorMessage = data.error;
        else
          this.successMessage = 'Регистрация прошла успешно!';
      } catch (err) {
        console.error('Registration error:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
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

.success-message {
  background-color: #d1f7d6;
  color: #006400;
  padding: 10px;
  border: 1px solid #a5e6aa;
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

.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  background: #f4f4f9;
  padding-top: 40px;
}

.register-header {
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

.register-box {
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

.login-link {
  display: block;
  margin-top: 15px;
  color: #1e3a8a;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
