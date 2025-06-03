<template>
  <div class="editor-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Редактор авторов</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button class="btn add" @click="openNewAuthorModal">Добавить автора</button>
        <button class="btn delete-selected" @click="deleteSelectedAuthors" :disabled="!selectedIds.length">Удалить выбранные</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        </div>
        <div class="cell image-cell">Фото</div>
        <div class="cell">Фамилия <input v-model="searchFields.lastname" @input="loadAuthors" placeholder="Поиск..." class="header-filter-input" /></div>
        <div class="cell">Имя <input v-model="searchFields.name" @input="loadAuthors" placeholder="Поиск..." class="header-filter-input" /></div>
        <div class="cell">Отчество <input v-model="searchFields.patronymic" @input="loadAuthors" placeholder="Поиск..." class="header-filter-input" /></div>
        <div class="cell sortable" @click="toggleSort">Последнее изменение <span v-if="sortField === 'updatedAt'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span></div>
      </div>

      <div
          v-for="author in authors"
          :key="author.id"
          class="table-row"
          @click="selectAuthor(author.id)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="author.id" v-model="selectedIds" />
        </div>
        <div class="cell image-cell">
          <img
              :src="author.picture ? 'data:image/jpeg;base64,' + author.picture : defaultAuthorAvatar"
              alt="Фото автора"
              class="author-image"
          />
        </div>
        <div class="cell">{{ author.lastname }}</div>
        <div class="cell">{{ author.name }}</div>
        <div class="cell">{{ author.patronymic }}</div>
        <div class="cell">{{ formatDate(author.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedAuthor" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="avatar-wrapper">
          <img
              :src="selectedAuthor.picture ? 'data:image/jpeg;base64,' + selectedAuthor.picture : defaultAuthorAvatar"
              alt="Фото автора"
              class="avatar-preview"
          />
          <label class="upload-avatar-button">
            Загрузить фото
            <input type="file" @change="onAvatarChange" hidden accept="image/jpeg, image/png"/>
          </label>
          <button
              v-if="selectedAuthor.picture || selectedAuthor.avatarFile"
              type="button"
              class="delete-avatar-button"
              @click="removeAvatar"
          >
            Удалить фото
          </button>
          <p v-if="avatarUploadMessage" class="avatar-upload-message">
            {{ avatarUploadMessage }}
          </p>
        </div>

        <h2>{{ isCreatingNew ? 'Добавление автора' : 'Редактирование автора' }}</h2>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div class="form-group">
          <label>Имя:</label>
          <input v-model="selectedAuthor.name" />
        </div>
        <div class="form-group">
          <label>Фамилия:</label>
          <input v-model="selectedAuthor.lastname" />
        </div>
        <div class="form-group">
          <label>Отчество:</label>
          <input v-model="selectedAuthor.patronymic" />
        </div>
        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="selectedAuthor.description"></textarea>
        </div>
        <div class="actions">
          <button @click="saveAuthor" class="btn save">Сохранить</button>
          <button v-if="!isCreatingNew" @click="deleteAuthor" class="btn delete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultAuthorAvatar from '@/assets/defaultAuthorAvatar.jpg'; // Предполагаемый путь

export default {
  data() {
    return {
      authors: [],
      selectedAuthor: null,
      isCreatingNew: false,
      sortDir: 'desc', // По умолчанию desc для updatedAt
      sortField: 'updatedAt', // По умолчанию сортировка по updatedAt
      selectedIds: [],
      searchFields: {
        name: '',
        lastname: '',
        patronymic: ''
      },
      errorMessage: '',
      defaultAuthorAvatar,
      avatarChanged: false,
      avatarUploadMessage: '',
    };
  },
  computed: {
    allSelected() {
      return this.authors.length > 0 && this.selectedIds.length === this.authors.length;
    }
  },
  async mounted() {
    await this.loadAuthors();
  },
  methods: {
    onAvatarChange(event) {
      const file = event.target.files[0];
      if (file) {
        if (!this.selectedAuthor) return; // Защита на случай, если selectedAuthor еще не определен

        // Проверка размера и типа файла (опционально, но рекомендуется)
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (file.size > maxSize) {
          this.avatarUploadMessage = 'Файл слишком большой (макс. 2MB).';
          event.target.value = ''; // Сброс input file
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          this.avatarUploadMessage = 'Неверный формат файла (только JPEG, PNG).';
          event.target.value = ''; // Сброс input file
          return;
        }

        this.selectedAuthor.avatarFile = file;
        this.avatarChanged = true;
        this.avatarUploadMessage = 'Изображение загружено ✅';
        const reader = new FileReader();
        reader.onload = e => {
          if (this.selectedAuthor) { // Дополнительная проверка
            this.selectedAuthor.picture = e.target.result.split(',')[1];
          }
        };
        reader.readAsDataURL(file);
      }
    },
    removeAvatar() {
      if (!this.selectedAuthor) return;
      this.selectedAuthor.picture = null;
      this.selectedAuthor.avatarFile = null;
      this.avatarChanged = true;
      this.avatarUploadMessage = 'Изображение удалено ❌';
    },
    async loadAuthors() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      const conditions = [];

      for (const field in this.searchFields) {
        const value = this.searchFields[field];
        if (value) {
          conditions.push({ var: field, operator: 'contain', value });
        }
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/get-author-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'and',
            search: '', // Общий поиск, если нужен
            sort_col: this.sortField, // Используем sort_col для бэкенда
            sort_dir: this.sortDir
          })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
          this.authors = [];
        } else if (responseJson.result && responseJson.result.rows.length > 0) {
          const authorsRes = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const authorsData = await authorsRes.json();
          if (authorsData.error) {
            this.errorMessage = authorsData.error;
          } else {
            this.authors = authorsData.result.rows;
          }
        } else {
          this.authors = [];
        }
      } catch (err) {
        console.error('Ошибка при загрузке авторов:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
        this.authors = [];
      }
    },
    toggleSort() {
      // Сейчас сортировка только по 'updatedAt', можно расширить для других полей, если нужно
      if (this.sortField === 'updatedAt') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'updatedAt';
        this.sortDir = 'desc'; // По умолчанию при смене поля на updatedAt - сначала новые
      }
      this.loadAuthors();
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString();
    },
    async selectAuthor(id) {
      this.errorMessage = '';
      this.avatarUploadMessage = '';
      this.avatarChanged = false;
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({author: {id}}) // Запрос одного автора по id
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          // Предполагаем, что бэкэнд возвращает одного автора в data.result.author
          this.selectedAuthor = data.result.author;
          if (this.selectedAuthor) {
            // Убедимся, что поля для аватара существуют
            this.selectedAuthor.avatarFile = null;
            if (typeof this.selectedAuthor.picture === 'undefined') {
              this.selectedAuthor.picture = null;
            }
          }
          this.isCreatingNew = false;
        }
      } catch (err) {
        console.error('Ошибка при получении автора:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    openNewAuthorModal() {
      this.selectedAuthor = {
        name: '',
        lastname: '',
        patronymic: '',
        description: '',
        picture: null,      // Для Base64 строки предпросмотра
        avatarFile: null    // Для объекта File
      };
      this.isCreatingNew = true;
      this.errorMessage = '';
      this.avatarChanged = false;
      this.avatarUploadMessage = '';
    },
    closeModal() {
      this.selectedAuthor = null;
      this.isCreatingNew = false;
      this.errorMessage = '';
      this.avatarChanged = false;
      this.avatarUploadMessage = '';
    },
    async saveAuthor() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Ошибка: токен авторизации отсутствует.';
        return;
      }
      if (!this.selectedAuthor) {
        this.errorMessage = 'Нет данных для сохранения.';
        return;
      }

      const formData = new FormData();
      formData.append('author', JSON.stringify({
        id: this.selectedAuthor.id, // будет undefined для нового автора
        name: this.selectedAuthor.name,
        lastname: this.selectedAuthor.lastname,
        patronymic: this.selectedAuthor.patronymic,
        description: this.selectedAuthor.description
      }));
      formData.append('avatarChanged', JSON.stringify(this.avatarChanged));

      if (this.avatarChanged && this.selectedAuthor.avatarFile) {
        formData.append('avatar', this.selectedAuthor.avatarFile);
      }
      // Если avatarChanged true, а avatarFile нет - бэкенд должен удалить аватар

      try {
        const response = await fetch('http://localhost:3000/proxy/set-author.json', {
          method: 'POST',
          headers: {
            // Content-Type не указываем, FormData сделает это автоматически
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadAuthors();
          this.closeModal();
          // avatarChanged и avatarUploadMessage сбрасываются в closeModal
        }
      } catch (err) {
        console.error('Ошибка при сохранении автора:', err);
        this.errorMessage = 'Ошибка подключения к серверу при сохранении автора.';
      }
    },
    async deleteAuthor() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!this.selectedAuthor || !this.selectedAuthor.id) {
        this.errorMessage = "Автор не выбран для удаления.";
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-author.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({author: {id: this.selectedAuthor.id}})
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadAuthors();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при удалении автора:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteSelectedAuthors() {
      if (!this.selectedIds.length) return;
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-author.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({author: {id: this.selectedIds}}) // Отправляем массив ID
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          this.selectedIds = [];
          await this.loadAuthors();
        }
      } catch (err) {
        console.error('Ошибка при удалении выбранных авторов:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.authors.map(author => author.id);
      } else {
        this.selectedIds = [];
      }
    },
    goBack() {
      this.$router.push('/editor');
    }
  }
};
</script>

<style scoped>
.editor-container {
  padding: 2rem;
}

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

.header-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}

.btn {
  background-color: #f3f4f6;
  color: #1f2937;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: scale(1.05);
}

.btn.add:hover {
  background-color: #10b981;
  color: white;
}

.btn.delete-selected:hover,
.btn.delete:hover {
  background-color: #ef4444;
  color: white;
}

.btn.save:hover {
  background-color: #2563eb;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.back-button {
  font-weight: 500;
  color: #374151;
  background-color: transparent;
  border: 1px solid #d1d5db;
}

.btn.back-button:hover {
  color: #111827;
  background-color: #e5e7eb;
  transform: translateX(-2px);
}

.table-container {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  /* checkbox | image | lastname | name | patronymic | updatedAt */
  grid-template-columns: 40px 80px 1.5fr 1.5fr 1.5fr 2fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
}

.table-header .cell {
  padding: 0.5rem;
}

.table-header .header-filter-input {
  margin-top: 5px;
  padding: 0.3rem 0.5rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 90%; /* Чтобы не вылезало за пределы ячейки */
  box-sizing: border-box;
}


.image-cell {
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.author-image { /* Было example-image */
  max-width: 60px;
  max-height: 60px;
  border-radius: 50%; /* Круглый аватар для автора */
  object-fit: cover; /* Для сохранения пропорций */
  border: 1px solid #eee;
}

.table-header {
  background-color: #f9fafb;
  font-weight: bold;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.table-row .cell {
  padding: 0.75rem 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-row:hover {
  background-color: #f0f0f0;
}

.cell.sortable {
  cursor: pointer;
  user-select: none;
}

.cell.sortable span {
  margin-left: 0.3rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  max-height: 90vh; /* Для длинных форм с прокруткой */
  overflow-y: auto;
}

.modal h2 {
  text-align: center;
  font-size: 1.5rem;
  margin-top: 0; /* Убираем верхний отступ, т.к. аватар теперь сверху */
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 80px;
}


.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.button-group-right {
  display: flex;
  gap: 1rem;
}

/* Стили для аватара, скопированные и адаптированные */
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px; /* Отступ снизу */
}

.avatar-preview {
  width: 120px; /* Фиксированный размер для предпросмотра */
  height: 120px;
  border: 2px solid #1e3a8a;
  border-radius: 50%; /* Круглый аватар */
  object-fit: cover; /* Для сохранения пропорций */
  margin-bottom: 10px;
}

.upload-avatar-button,
.delete-avatar-button {
  background-color: transparent;
  color: #1e3a8a;
  border: 1px solid #1e3a8a;
  padding: 8px 14px;
  margin-top: 8px; /* Отступ сверху для кнопок */
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.upload-avatar-button:hover,
.delete-avatar-button:hover {
  background-color: #1e3a8a;
  color: white;
  transform: scale(1.02);
}


.avatar-upload-message {
  color: #1e3a8a;
  background-color: #f1f5f9;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 10px; /* Отступ сверху для сообщения */
  text-align: center;
}
</style>