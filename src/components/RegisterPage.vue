<template>
  <div>
    <h1>Регистрация</h1>
    <input v-model="username" placeholder="Логин" />
    <input v-model="password" placeholder="Пароль" type="password" />
    <button @click="register">Зарегистрироваться</button>
    <br />
    <router-link to="/login">Уже есть аккаунт? Войти</router-link>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
    }
  },
  methods: {
    async register() {
      try {
        const response = await fetch('http://localhost:3000/proxy/sign-up-user.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: {login: this.username, password: this.password} }),
        });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
        } else {
          console.log('Token:', data);
          alert('Регистрация успешна!');
          this.$router.push('/login');
        }
      } catch (err) {
        console.error('Registration error:', err);
        alert('Ошибка регистрации');
      }
    }
  }
}
</script>
