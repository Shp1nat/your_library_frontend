<template>
  <div class="profile-container">
    <h2>Профиль пользователя</h2>
    <form class="profile-form" @submit.prevent="saveProfile">
      <div class="form-group">
        <label for="login">Логин</label>
        <input id="login" v-model="user.login" type="text" required />
      </div>
      <div class="form-group">
        <label for="name">Имя</label>
        <input id="name" v-model="user.name" type="text" required />
      </div>
      <div class="form-group">
        <label for="lastname">Фамилия</label>
        <input id="lastname" v-model="user.lastname" type="text" required />
      </div>
      <!-- Добавленное поле "Отчество" -->
      <div class="form-group">
        <label for="patronymic">Отчество</label>
        <input id="patronymic" v-model="user.patronymic" type="text" required />
      </div>
      <div class="form-group">
        <label for="age">Возраст</label>
        <input id="age" v-model="user.age" type="number" min="1" required />
      </div>
      <button type="submit" class="save-button">Сохранить</button>

      <!-- Сообщения об успехе и ошибке -->
      <div v-if="successMessage" class="message success-message">
        <p>{{ successMessage }}</p>
      </div>
      <div v-if="errorMessage" class="message error-message">
        <p>{{ errorMessage }}</p>
      </div>
    </form>
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
        patronymic: '',
        age: null,
      },
      successMessage: '',
      errorMessage: ''
    };
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
      if (data.error) {
        this.errorMessage = data.error;
      } else {
        this.user = data.result;
      }
    } catch (err) {
      console.error('Ошибка при получении профиля', err);
      this.errorMessage = 'Не удалось загрузить данные пользователя.';
    }
  },
  methods: {
    async saveProfile() {
      this.successMessage = '';
      this.errorMessage = '';

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
              patronymic: this.user.patronymic,
              age: this.user.age
            }
          })
        });
        const data = await response.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.successMessage = 'Информация успешно сохранёна!';
        }
      } catch (err) {
        console.error('Ошибка при сохранении профиля', err);
        this.errorMessage = 'Не удалось сохранить профиль.';
      }
    }
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

h2 {
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
  color: #1e3a8a;
  text-align: center;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #1e3a8a;
  outline: none;
}

.save-button {
  padding: 12px;
  background-color: #1e3a8a;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-button:hover {
  background-color: #2c5282;
}

/* Стиль сообщений об успехе и ошибке */
.message {
  padding: 12px;
  margin-top: 20px;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
}

.success-message {
  background-color: #d4edda;
  color: #3c763d;
  border: 1px solid #c3e6cb;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message p {
  margin: 0;
}
</style>
