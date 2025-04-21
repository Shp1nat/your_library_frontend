<template>
  <div>
    <h1>Вход</h1>
    <input v-model="username" placeholder="Логин" />
    <input v-model="password" placeholder="Пароль" type="password" />
    <button @click="login">Войти</button>
    <br />
    <router-link to="/register">Нет аккаунта? Зарегистрироваться</router-link>
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
    async login() {
      try {
        const response = await fetch('http://localhost:3000/proxy/sign-in-user.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: {login: this.username, password: this.password} }),
        })
        const data = await response.json()
        if (data.error) {
          alert(data.error)
        } else {
          console.log('TOKEN:', data.result.accessToken)
          localStorage.setItem('token', data.result.accessToken)
          localStorage.setItem('userId', data.result.id)
          alert('Вход выполнен!')
          this.$router.push('/dashboard/profile')
        }
      } catch (err) {
        console.error('Login error:', err)
        alert('Ошибка входа')
      }
    }
  }
}
</script>
