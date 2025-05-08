<template>
  <div class="editor-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Редактор жанров</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button class="btn add" @click="openNewGenreModal">Добавить жанр</button>
        <button class="btn delete-selected" @click="deleteSelectedGenres" :disabled="!selectedIds.length">Удалить выбранные</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell"></div>
        <div class="cell">Название <input v-model="searchName" @input="loadGenres" /></div>
        <div class="cell sortable" @click="toggleSort">Последнее изменение {{ sortDir === 'asc' ? '↑' : '↓' }}</div>
      </div>

      <div
          v-for="genre in genres"
          :key="genre.id"
          class="table-row"
          @click="selectGenre(genre.id)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="genre.id" v-model="selectedIds" />
        </div>
        <div class="cell">{{ genre.name }}</div>
        <div class="cell">{{ formatDate(genre.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedGenre" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isCreatingNew ? 'Добавление жанра' : 'Редактирование жанра' }}</h2>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div class="form-group">
          <label>Название:</label>
          <input v-model="selectedGenre.name" />
        </div>
        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="selectedGenre.description"></textarea>
        </div>
        <div class="actions">
          <button @click="saveGenre" class="btn save">Сохранить</button>
          <button v-if="!isCreatingNew" @click="deleteGenre" class="btn delete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      genres: [],
      selectedGenre: null,
      isCreatingNew: false,
      sortDir: 'asc',
      selectedIds: [],
      searchName: '',
      errorMessage: ''
    }
  },
  async mounted() {
    await this.loadGenres();
  },
  methods: {
    async loadGenres() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      const conditions = [];

      if (this.searchName) {
        conditions.push({ var: 'name', operator: 'contain', value: this.searchName });
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/get-genre-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'and',
            search: '',
            sort: 'updatedAt',
            sort_dir: this.sortDir
          })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
          this.genres = [];
        } else if (responseJson.result.rows.length > 0) {
          const genresRes = await fetch('http://localhost:3000/proxy/get-genre-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });
          const genresData = await genresRes.json();
          if (genresData.error) {
            this.errorMessage = genresData.error;
          } else {
            this.genres = genresData.result.rows;
          }
        } else {
          this.genres = [];
        }
      } catch (err) {
        console.error('Ошибка при загрузке жанров:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
        this.genres = [];
      }
    },
    toggleSort() {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadGenres();
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    async selectGenre(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/proxy/get-genre-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ genre: { id } })
        });
        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error; // Обработка ошибки
        } else {
          this.selectedGenre = data.result.genre;
        }
      } catch (err) {
        console.error('Ошибка при получении жанра:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    openNewGenreModal() {
      this.selectedGenre = {
        name: '',
        description: ''
      };
      this.isCreatingNew = true;
    },
    closeModal() {
      this.selectedGenre = null;
      this.isCreatingNew = false;
    },
    async saveGenre() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/set-genre.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ genre: this.selectedGenre })
        });
        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadGenres();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при сохранении жанра:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteGenre() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-genre.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ genre: { id: this.selectedGenre.id } })
        });
        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadGenres();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при удалении жанра:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteSelectedGenres() {
      if (!this.selectedIds.length) return;
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-genre.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ genre: { id: this.selectedIds } })
        });
        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          this.selectedIds = [];
          await this.loadGenres();
        }
      } catch (err) {
        console.error('Ошибка при удалении выбранных жанров:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    goBack() {
      this.$router.push('/editor');
    }
  }
}
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

.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.button-group-right {
  display: flex;
  gap: 1rem;
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

.table-header, .table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
}

.table-header {
  background-color: #f9fafb;
  font-weight: bold;
  padding: 0.5rem;
}

.table-header .cell input {
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.25rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.table-row {
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f3f4f6;
}

.cell {
  padding: 0.5rem;
}

.checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.modal h2 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
}

textarea {
  resize: none;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}
</style>