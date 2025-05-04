<template>
  <div class="editor-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Редактор книг</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button class="btn add" @click="openNewBookModal">Добавить книгу</button>
        <button class="btn delete-selected" @click="deleteSelectedBooks" :disabled="!selectedIds.length">Удалить выбранные</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell"></div>
        <div class="cell">Название <input v-model="searchFields.name" @input="loadBooks" /></div>
        <div class="cell year-column">
          <div class="column-header sortable" @click="toggleYearSort">
            <span style="margin-right: 0.3rem;">Год</span>
            <span v-if="sortField === 'year'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
          <div class="year-filter">
            <input type="number" v-model="searchFields.year_from" @input="loadBooks" placeholder="От" />
            <input type="number" v-model="searchFields.year_to" @input="loadBooks" placeholder="До" />
          </div>
        </div>
        <div class="cell sortable" @click="toggleSort">
          Последнее изменение <span v-if="sortField === 'updatedAt'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
      </div>

      <div
          v-for="book in books"
          :key="book.id"
          class="table-row"
          @click="selectBook(book.id)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="book.id" v-model="selectedIds" />
        </div>
        <div class="cell">{{ book.name }}</div>
        <div class="cell">{{ book.year }}</div>
        <div class="cell">{{ formatDate(book.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedBook" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isCreatingNew ? 'Добавление книги' : 'Редактирование книги' }}</h2>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="form-group">
          <label>Название:</label>
          <input v-model="selectedBook.name" />
        </div>
        <div class="form-group">
          <label>Год:</label>
          <input type="number" v-model="selectedBook.year" />
        </div>
        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="selectedBook.description"></textarea>
        </div>

        <div class="form-group">
          <label>Авторы:</label>
          <input v-model="authorSearch" @input="searchAuthors" placeholder="Поиск авторов..." />
          <div class="multi-select">
            <div
                v-for="author in availableAuthors"
                :key="author.id"
                class="select-item"
                @click="toggleAuthor(author)"
                :class="{ selected: selectedBook.authors.some(a => a.id === author.id) }"
            >
              {{ author.name }} {{ author.patronymic }} {{ author.lastname }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Жанры:</label>
          <input v-model="genreSearch" @input="searchGenres" placeholder="Поиск жанров..." />
          <div class="multi-select">
            <div
                v-for="genre in availableGenres"
                :key="genre.id"
                class="select-item"
                @click="toggleGenre(genre)"
                :class="{ selected: selectedBook.genres.some(g => g.id === genre.id) }"
            >
              {{ genre.name }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Типы:</label>
          <input v-model="typeSearch" @input="searchTypes" placeholder="Поиск типов..." />
          <div class="multi-select">
            <div
                v-for="type in availableTypes"
                :key="type.id"
                class="select-item"
                @click="toggleType(type)"
                :class="{ selected: selectedBook.types.some(t => t.id === type.id) }"
            >
              {{ type.name }}
            </div>
          </div>
        </div>

        <div class="actions">
          <button @click="saveBook" class="btn save">Сохранить</button>
          <button v-if="!isCreatingNew" @click="deleteBook" class="btn delete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      books: [],
      selectedBook: null,
      isCreatingNew: false,
      sortDir: 'asc',
      sortField: 'updatedAt',
      selectedIds: [],
      searchFields: {
        name: '',
        year_from: '',
        year_to: ''
      },
      errorMessage: '',

      availableAuthors: [],
      availableGenres: [],
      availableTypes: [],

      authorSearch: '',
      genreSearch: '',
      typeSearch: ''
    }
  },
  async mounted() {
    await this.loadBooks();
  },
  methods: {
    async loadBooks() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      const conditions = [];

      for (const field in this.searchFields) {
        const value = this.searchFields[field];
        if (value) {
          switch (field) {
            case 'name':
              conditions.push({ var: 'name', operator: 'contain', value });
              break;
            case 'year_from':
              conditions.push({ var: 'year', operator: 'greater_or_equal', value });
              break;
            case 'year_to':
              conditions.push({ var: 'year', operator: 'less_or_equal', value });
              break;
          }
        }
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/get-book-ids.json', {
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
          this.books = [];
        } else if (responseJson.result && responseJson.result.rows.length > 0) {
          const booksRes = await fetch('http://localhost:3000/proxy/get-book-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const booksData = await booksRes.json();
          if (booksData.error) {
            this.errorMessage = booksData.error;
          } else {
            this.books = booksData.result.rows;
          }
        } else {
          this.books = [];
        }
      } catch (err) {
        console.error('Ошибка при загрузке книг:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
        this.books = [];
      }
    },
    toggleSort() {
      this.sortField = 'updatedAt';
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadBooks();
    },
    toggleYearSort() {
      this.sortField = 'year';
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadBooks();
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    async selectBook(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/proxy/get-book-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ book: { id } })
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.selectedBook = data.result.book;
          this.isCreatingNew = false;

          if (this.selectedBook.genres && this.selectedBook.genres.every(g => typeof g === 'object' && g !== null && g.id)) {
            this.availableGenres = [...this.selectedBook.genres];
          } else if (this.selectedBook.genres && this.selectedBook.genres.length > 0) {
            const genreIds = this.selectedBook.genres.map(g => ({ id: g }));
            const genresRes = await fetch('http://localhost:3000/proxy/get-genre-ids-out.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ genre: genreIds })
            });
            const genresData = await genresRes.json();
            this.availableGenres = genresData.result?.rows || [];
            this.selectedBook.genres = this.availableGenres.map(g => ({ id: g.id }));
          } else {
            this.availableGenres = [];
          }

          if (this.selectedBook.authors && this.selectedBook.authors.every(a => typeof a === 'object' && a !== null && a.id)) {
            this.availableAuthors = [...this.selectedBook.authors];
          } else if (this.selectedBook.authors && this.selectedBook.authors.length > 0) {
            const authorIds = this.selectedBook.authors.map(a => ({ id: a }));
            const authorsRes = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ author: authorIds })
            });
            const authorsData = await authorsRes.json();
            this.availableAuthors = authorsData.result?.rows || [];
            this.selectedBook.authors = this.availableAuthors.map(a => ({ id: a.id }));
          } else {
            this.availableAuthors = [];
          }

          if (this.selectedBook.types && this.selectedBook.types.every(t => typeof t === 'object' && t !== null && t.id)) {
            this.availableTypes = [...this.selectedBook.types];
          } else if (this.selectedBook.types && this.selectedBook.types.length > 0) {
            const typeIds = this.selectedBook.types.map(t => ({ id: t }));
            const typesRes = await fetch('http://localhost:3000/proxy/get-type-ids-out.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ type: typeIds })
            });
            const typesData = await typesRes.json();
            this.availableTypes = typesData.result?.rows || [];
            this.selectedBook.types = this.availableTypes.map(t => ({ id: t.id }));
          } else {
            this.availableTypes = [];
          }
        }
      } catch (err) {
        console.error('Ошибка при получении книги:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    openNewBookModal() {
      this.selectedBook = {
        name: '',
        description: '',
        year: '',
        authors: [],
        genres: [],
        types: []
      };
      this.isCreatingNew = true;
      this.authorSearch = '';
      this.genreSearch = '';
      this.typeSearch = '';
      this.searchAuthors();
      this.searchGenres();
      this.searchTypes();
    },
    closeModal() {
      this.selectedBook = null;
      this.isCreatingNew = false;
    },
    async saveBook() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/set-book.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ book: this.selectedBook })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadBooks();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при сохранении книги:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteBook() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-book.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ book: { id: this.selectedBook.id } })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadBooks();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при удалении книги:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteSelectedBooks() {
      if (!this.selectedIds.length) return;
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-book.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ book: { id: this.selectedIds } })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          this.selectedIds = [];
          await this.loadBooks();
        }
      } catch (err) {
        console.error('Ошибка при удалении выбранных книг:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async searchAuthors() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/get-author-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions: this.authorSearch ? [
                { var: 'name', operator: 'contain', value: this.authorSearch },
              { var: 'lastname', operator: 'contain', value: this.authorSearch },
              { var: 'patronymic', operator: 'contain', value: this.authorSearch }
            ] : [],
            main_cond: 'or',
            search: '',
            sort: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10)
          const outRes = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const outJson = await outRes.json();
          this.availableAuthors = outJson.result.rows || [];
        } else {
          this.availableAuthors = [];
        }
      } catch (err) {
        console.error('Ошибка при поиске авторов:', err);
        this.availableAuthors = [];
      }
    },

    async searchGenres() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/get-genre-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions: this.genreSearch ? [{ var: 'name', operator: 'contain', value: this.genreSearch }] : [],
            main_cond: 'and',
            search: '',
            sort: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10)
          const outRes = await fetch('http://localhost:3000/proxy/get-genre-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const outJson = await outRes.json();
          this.availableGenres = outJson.result.rows || [];
        } else {
          this.availableGenres = [];
        }
      } catch (err) {
        console.error('Ошибка при поиске жанров:', err);
        this.availableGenres = [];
      }
    },

    async searchTypes() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/get-type-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions: this.typeSearch ? [{ var: 'name', operator: 'contain', value: this.typeSearch }] : [],
            main_cond: 'and',
            search: '',
            sort: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10)
          const outRes = await fetch('http://localhost:3000/proxy/get-type-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const outJson = await outRes.json();
          this.availableTypes = outJson.result.rows || [];
        } else {
          this.availableTypes = [];
        }
      } catch (err) {
        console.error('Ошибка при поиске типов:', err);
        this.availableTypes = [];
      }
    },
    toggleAuthor(author) {
      const idx = this.selectedBook.authors.findIndex(a => a.id === author.id);
      if (idx >= 0) this.selectedBook.authors.splice(idx, 1);
      else this.selectedBook.authors.push({ id: author.id });
    },
    toggleGenre(genre) {
      const idx = this.selectedBook.genres.findIndex(g => g.id === genre.id);
      if (idx >= 0) this.selectedBook.genres.splice(idx, 1);
      else this.selectedBook.genres.push({ id: genre.id });
    },
    toggleType(type) {
      const idx = this.selectedBook.types.findIndex(t => t.id === type.id);
      if (idx >= 0) this.selectedBook.types.splice(idx, 1);
      else this.selectedBook.types.push({ id: type.id });
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

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.table-row:hover {
  background-color: #f0f0f0;
}

.table-header {
  background-color: #f9fafb;
  font-weight: bold;
  padding: 0.5rem;
}

.cell {
  padding: 0.5rem;
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

input,
.year-filter input,
textarea,
select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  resize: none;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.year-column {
  display: flex;
  flex-direction: column;
}

.column-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.year-filter {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-top: 0.25rem;
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

.multi-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.select-item {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: background-color 0.2s, border-color 0.2s;
}

.select-item:hover {
  background-color: #eee;
}

.select-item.selected {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
</style>