<template>
  <div>
    <h2>Профиль пользователя</h2>
    <div>
      <label>Логин: <input v-model="user.login" /></label><br />
      <label>Имя: <input v-model="user.name" /></label><br />
      <label>Фамилия: <input v-model="user.lastname" /></label><br />
      <label>Возраст: <input v-model="user.age" type="number" /></label><br />
      <button @click="saveProfile">Сохранить</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        login: '',
        name: '',
        lastname: '',
        age: null,
      }
    }
  },
  async mounted() {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/proxy/get-user-info.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.error)
        alert(data.error);
      else
        this.user = data.result;
    } catch (err) {
      console.error('Ошибка при получении профиля', err);
    }
  },
  methods: {
    async saveProfile() {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/set-user.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user: {
              id: parseInt(userId),
              login: this.user.login,
              name: this.user.name,
              lastname: this.user.lastname,
              age: this.user.age
            }
          })
        });
        const data = await response.json();
        if (data.error) {
          alert('Ошибка сохранения: ' + data.error);
        } else {
          alert('Профиль обновлен');
        }
      } catch (err) {
        console.error('Ошибка при сохранении профиля', err);
      }
    }
  }
}
</script>
