<template>
  <div class="profile-container">
    <h2>Ваш профиль</h2>
    <form class="profile-form" @submit.prevent="saveProfile">
      <div class="avatar-wrapper">
        <img
            :src="user.picture ? 'data:image/jpeg;base64,' + user.picture : defaultAvatar"
            alt="Avatar"
            class="avatar-preview"
        />
        <label class="upload-avatar-button">
          Загрузить изображение
          <input type="file" @change="onAvatarChange" hidden />
        </label>
        <p v-if="avatarUploadMessage" class="avatar-upload-message">{{ avatarUploadMessage }}</p>
        <button
            v-if="user.picture"
            type="button"
            class="delete-avatar-button"
            @click="removeAvatar"
        >
          Удалить изображение
        </button>
      </div>
      <div class="form-group">
        <label for="login">Логин</label>
        <input id="login" v-model="user.login" type="text" required />
      </div>
      <div class="form-group">
        <label for="name">Имя</label>
        <input id="name" v-model="user.name" type="text" />
      </div>
      <div class="form-group">
        <label for="lastname">Фамилия</label>
        <input id="lastname" v-model="user.lastname" type="text" />
      </div>
      <div class="form-group">
        <label for="patronymic">Отчество</label>
        <input id="patronymic" v-model="user.patronymic" type="text" />
      </div>
      <div class="form-group">
        <label for="age">Возраст</label>
        <input id="age" v-model="user.age" type="number" min="1" />
      </div>
      <div class="form-group">
        <label>Штрафные очки</label>
        <p class="penalty-points-display">{{ user.penaltyPoints }}</p>
      </div>
      <button type="submit" class="save-button">Сохранить</button>

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
import defaultAvatar from '@/assets/defaultUserAvatar.jpg';
export default {
  data() {
    return {
      user: {
        id: null,
        login: '',
        name: '',
        lastname: '',
        patronymic: '',
        age: null,
        avatar: null,
        picture: null,
        penaltyPoints: null
      },
      avatarChanged: false,
      successMessage: '',
      errorMessage: '',
      avatarUploadMessage: '',
      defaultAvatar
    };
  },
  async mounted() {
    await this.fetchUserData();
  },
  methods: {
    onAvatarChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.user.avatar = file;
        this.avatarChanged = true;
        this.avatarUploadMessage = 'Изображение загружено ✅';
        const reader = new FileReader();
        reader.onload = (e) => {
          this.user.picture = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
      } else {
        this.avatarUploadMessage = '';
      }
    },
    removeAvatar() {
      this.user.picture = null;
      this.user.avatar = null;
      this.avatarChanged = true;
      this.avatarUploadMessage = 'Изображение удалено ❌';
    },
    async saveProfile() {
      this.successMessage = '';
      this.errorMessage = '';

      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Ошибка: Токен авторизации отсутствует.';
        return;
      }

      const formData = new FormData();

      formData.append('user', JSON.stringify({
        id: this.user.id,
        login: this.user.login,
        name: this.user.name,
        lastname: this.user.lastname,
        patronymic: this.user.patronymic,
        age: this.user.age
      }));
      formData.append('avatarChanged', JSON.stringify(this.avatarChanged));

      if (this.avatarChanged && this.user.avatar) {
        formData.append('avatar', this.user.avatar);
      } else if (this.avatarChanged && !this.user.picture) {
        // Случай, когда аватар был удален. Бэкенд должен это обработать.
        // Можно добавить специальный флаг или отправить пустое значение для picture
        // В данном случае, флаг avatarChanged=true и отсутствие файла 'avatar' может сигнализировать об удалении
      }


      try {
        const response = await fetch('http://localhost:3000/proxy/update-profile.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка HTTP: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.successMessage = 'Информация успешно сохранёна!';
          this.avatarChanged = false;
          await this.fetchUserData();
        }
      } catch (err) {
        console.error('Ошибка при сохранении профиля', err);
        this.errorMessage = `Не удалось сохранить профиль: ${err.message || err}`;
      }
    },
    async fetchUserData() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Ошибка: Токен авторизации отсутствует. Пожалуйста, войдите снова.';
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/proxy/get-user-info.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка HTTP: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.user = data.result;
          this.avatarUploadMessage = '';
        }
      } catch (err) {
        console.error('Ошибка при получении профиля', err);
        this.errorMessage = `Не удалось загрузить данные пользователя: ${err.message || err}`;
      }
    }
  }
};
</script>

<style scoped>
/* Стили из вашего скриншота */
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
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.save-button:hover {
  background-color: #2c5282;
  transform: scale(1.05);
}

.message {
  padding: 12px;
  margin-top: 20px;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
}

.success-message {
  background-color: #f0f9ff;
  color: #1e3a8a;
  border: 1px solid #d1e7fd;
  padding: 8px 16px;
  margin-top: 20px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  font-size: 14px;
}

.success-message p {
  margin: 0;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message p {
  margin: 0;
}

.avatar-preview {
  max-width: 150px;
  margin-bottom: 10px;
  border-radius: 10px;
  box-shadow: none;
  border: 2px solid #1e3a8a;
}

.upload-avatar-button,
.delete-avatar-button {
  background-color: transparent;
  color: #1e3a8a;
  border: 1px solid #1e3a8a;
  padding: 8px 14px;
  margin: 8px 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.upload-avatar-button:hover,
.delete-avatar-button:hover {
  background-color: #1e3a8a;
  color: white;
  transform: scale(1.05);
}

.avatar-upload-message {
  color: #1e3a8a;
  background-color: #f1f5f9;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  text-align: center;
}

.penalty-points-display {
  font-size: 16px;
  color: #333;
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  min-height: 40px;
  display: flex;
  align-items: center;
}
</style>