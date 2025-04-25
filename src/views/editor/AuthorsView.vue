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
        <div class="cell checkbox-cell"></div>
        <div class="cell">Фамилия <input v-model="searchFields.lastname" @input="loadAuthors" /></div>
        <div class="cell">Имя <input v-model="searchFields.name" @input="loadAuthors" /></div>
        <div class="cell">Отчество <input v-model="searchFields.patronymic" @input="loadAuthors" /></div>
        <div class="cell sortable" @click="toggleSort">Последнее изменение {{ sortDir === 'asc' ? '↑' : '↓' }}</div>
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
        <div class="cell">{{ author.lastname }}</div>
        <div class="cell">{{ author.name }}</div>
        <div class="cell">{{ author.patronymic }}</div>
        <div class="cell">{{ formatDate(author.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedAuthor" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
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
export default {
  data() {
    return {
      authors: [],
      selectedAuthor: null,
      isCreatingNew: false,
      sortDir: 'asc',
      selectedIds: [],
      searchFields: {
        name: '',
        lastname: '',
        patronymic: ''
      },
      errorMessage: ''
    }
  },
  async mounted() {
    await this.loadAuthors()
  },
  methods: {
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
            search: '',
            sort: 'updatedAt',
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
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadAuthors();
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    async selectAuthor(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ author: { id } })
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.selectedAuthor = data.result.author;
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
        description: ''
      };
      this.isCreatingNew = true;
    },
    closeModal() {
      this.selectedAuthor = null;
      this.isCreatingNew = false;
    },
    async saveAuthor() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/set-author.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ author: this.selectedAuthor })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadAuthors();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при сохранении автора:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteAuthor() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-author.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ author: { id: this.selectedAuthor.id } })
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
          body: JSON.stringify({ author: { id: this.selectedIds } })
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
  grid-template-columns: 40px 1fr 1fr 1fr 1fr;
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