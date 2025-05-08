<template>
  <div class="editor-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Редактор экземпляров</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button class="btn add" @click="openNewExampleModal">Добавить экземпляр</button>
        <button class="btn delete-selected" @click="deleteSelectedExamples" :disabled="!selectedIds.length">Удалить выбранные</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        </div>
        <div class="cell">Описание <input v-model="searchFields.description" @input="loadExamples" /></div>
        <div class="cell">Год <input type="number" v-model="searchFields.year" @input="loadExamples" /></div>
        <div class="cell">Количество <input type="number" v-model="searchFields.quantity" @input="loadExamples" /></div>
        <div class="cell sortable" @click="toggleBookSort">
          Книга <span v-if="sortField === 'book.name'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
        <div class="cell sortable" @click="togglePublisherSort">
          Издательство <span v-if="sortField === 'publisher.name'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
        <div class="cell sortable" @click="toggleSort">
          Последнее изменение <span v-if="sortField === 'updatedAt'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
      </div>

      <div
          v-for="example in examples"
          :key="example.id"
          class="table-row"
          @click="selectExample(example.id)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="example.id" v-model="selectedIds" />
        </div>
        <div class="cell">{{ example.description }}</div>
        <div class="cell">{{ example.year }}</div>
        <div class="cell">{{ example.quantity }}</div>
        <div class="cell">{{ example.book?.name }}</div>
        <div class="cell">{{ example.publisher?.name }}</div>
        <div class="cell">{{ formatDate(example.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedExample" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isCreatingNew ? 'Добавление экземпляра' : 'Редактирование экземпляра' }}</h2>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="selectedExample.description"></textarea>
        </div>
        <div class="form-group">
          <label>Год:</label>
          <input type="number" v-model="selectedExample.year" />
        </div>
        <div class="form-group">
          <label>Количество:</label>
          <input type="number" v-model="selectedExample.quantity" />
        </div>

        <div class="form-group">
          <label>Книга:</label>
          <input v-model="bookSearch" @input="searchBooks" placeholder="Поиск книг..." />
          <div class="single-select">
            <div
                v-for="book in availableBooks"
                :key="book.id"
                class="select-item"
                @click="setSelectedBook(book)"
                :class="{ selected: selectedExample.book?.id === book.id }"
            >
              {{ book.name }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Издательство:</label>
          <input v-model="publisherSearch" @input="searchPublishers" placeholder="Поиск издательств..." />
          <div class="single-select">
            <div
                v-for="publisher in availablePublishers"
                :key="publisher.id"
                class="select-item"
                @click="setSelectedPublisher(publisher)"
                :class="{ selected: selectedExample.publisher?.id === publisher.id }"
            >
              {{ publisher.name }}
            </div>
          </div>
        </div>

        <div class="actions">
          <button @click="saveExample" class="btn save">Сохранить</button>
          <button v-if="!isCreatingNew" @click="deleteExample" class="btn delete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      examples: [],
      selectedExample: null,
      isCreatingNew: false,
      sortDir: 'asc',
      sortField: 'updatedAt',
      selectedIds: [],
      searchFields: {
        description: '',
        year: '',
        quantity: ''
      },
      errorMessage: '',

      availableBooks: [],
      availablePublishers: [],

      bookSearch: '',
      publisherSearch: ''
    }
  },
  computed: {
    allSelected() {
      return this.examples.length > 0 && this.selectedIds.length === this.examples.length;
    }
  },
  async mounted() {
    await this.loadExamples();
  },
  methods: {
    async loadExamples() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      const conditions = [];

      for (const field in this.searchFields) {
        const value = this.searchFields[field];
        if (value) {
          switch (field) {
            case 'description':
              conditions.push({ var: 'description', operator: 'contain', value });
              break;
            case 'year':
              conditions.push({ var: 'year', operator: 'equal', value });
              break;
            case 'quantity':
              conditions.push({ var: 'quantity', operator: 'equal', value });
              break;
          }
        }
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/get-example-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'and',
            search: '',
            sort: this.sortField.includes('.') ? this.sortField : 'updatedAt',
            sort_dir: this.sortDir
          })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
          this.examples = [];
        } else if (responseJson.result && responseJson.result.rows.length > 0) {
          const examplesRes = await fetch('http://localhost:3000/proxy/get-example-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const examplesData = await examplesRes.json();
          if (examplesData.error) {
            this.errorMessage = examplesData.error;
          } else {
            this.examples = examplesData.result.rows;
          }
        } else {
          this.examples = [];
        }
      } catch (err) {
        console.error('Ошибка при загрузке экземпляров:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
        this.examples = [];
      }
    },
    toggleSort() {
      this.sortField = 'updatedAt';
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadExamples();
    },
    toggleBookSort() {
      this.sortField = 'book.name';
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadExamples();
    },
    togglePublisherSort() {
      this.sortField = 'publisher.name';
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadExamples();
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    async selectExample(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/proxy/get-example-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ example: { id } })
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.selectedExample = data.result.example;
          this.isCreatingNew = false;

          if (this.selectedExample.book && typeof this.selectedExample.book === 'object' && this.selectedExample.book !== null && this.selectedExample.book.id) {
            this.availableBooks = [this.selectedExample.book];
            this.bookSearch = this.selectedExample.book.name;
          } else if (this.selectedExample.book) {
            const bookRes = await fetch('http://localhost:3000/proxy/get-book-ids-out.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ book: { id: this.selectedExample.book } })
            });
            const bookData = await bookRes.json();
            this.availableBooks = bookData.result?.rows || [];
            this.selectedExample.book = this.availableBooks[0] || null;
            this.bookSearch = this.selectedExample.book?.name || '';
          } else {
            this.availableBooks = [];
            this.bookSearch = '';
            this.selectedExample.book = null;
          }

          if (this.selectedExample.publisher && typeof this.selectedExample.publisher === 'object' && this.selectedExample.publisher !== null && this.selectedExample.publisher.id) {
            this.availablePublishers = [this.selectedExample.publisher];
            this.publisherSearch = this.selectedExample.publisher.name;
          } else if (this.selectedExample.publisher) {
            const publisherRes = await fetch('http://localhost:3000/proxy/get-publisher-ids-out.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ publisher: { id: this.selectedExample.publisher } })
            });
            const publisherData = await publisherRes.json();
            this.availablePublishers = publisherData.result?.rows || [];
            this.selectedExample.publisher = this.availablePublishers[0] || null;
            this.publisherSearch = this.selectedExample.publisher?.name || '';
          } else {
            this.availablePublishers = [];
            this.publisherSearch = '';
            this.selectedExample.publisher = null;
          }
        }
      } catch (err) {
        console.error('Ошибка при получении экземпляра:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    openNewExampleModal() {
      this.selectedExample = {
        description: '',
        year: '',
        quantity: '',
        book: null,
        publisher: null
      };
      this.isCreatingNew = true;
      this.bookSearch = '';
      this.publisherSearch = '';
      this.searchBooks();
      this.searchPublishers();
    },
    closeModal() {
      this.selectedExample = null;
      this.isCreatingNew = false;
    },
    async saveExample() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      const payload = {
        example: {
          description: this.selectedExample.description,
          year: this.selectedExample.year,
          quantity: this.selectedExample.quantity,
          book: this.selectedExample.book?.id,
          publisher: this.selectedExample.publisher?.id
        }
      };
      if (!this.isCreatingNew && this.selectedExample.id) {
        payload.example.id = this.selectedExample.id;
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/set-example.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadExamples();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при сохранении экземпляра:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteExample() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-example.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ example: { id: this.selectedExample.id } })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadExamples();
          this.closeModal();
        }
      } catch (err) {
        console.error('Ошибка при удалении экземпляра:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async deleteSelectedExamples() {
      if (!this.selectedIds.length) return;
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/remove-example.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ example: { id: this.selectedIds } })
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          this.selectedIds = [];
          await this.loadExamples();
        }
      } catch (err) {
        console.error('Ошибка при удалении выбранных экземпляров:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
      }
    },
    async searchBooks() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/get-book-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions: this.bookSearch ? [{ var: 'name', operator: 'contain', value: this.bookSearch }] : [],
            main_cond: 'and',
            search: '',
            sort: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10)
          const outRes = await fetch('http://localhost:3000/proxy/get-book-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const outJson = await outRes.json();
          this.availableBooks = outJson.result.rows || [];
        } else {
          this.availableBooks = [];
        }
      } catch (err) {
        console.error('Ошибка при поиске книг:', err);
        this.availableBooks = [];
      }
    },

    async searchPublishers() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3000/proxy/get-publisher-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions: this.publisherSearch ? [{ var: 'name', operator: 'contain', value: this.publisherSearch }] : [],
            main_cond: 'and',
            search: '',
            sort: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10)
          const outRes = await fetch('http://localhost:3000/proxy/get-publisher-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const outJson = await outRes.json();
          this.availablePublishers = outJson.result.rows || [];
        } else {
          this.availablePublishers = [];
        }
      } catch (err) {
        console.error('Ошибка при поиске издательств:', err);
        this.availablePublishers = [];
      }
    },
    setSelectedBook(book) {
      this.selectedExample.book = book;
    },
    setSelectedPublisher(publisher) {
      this.selectedExample.publisher = publisher;
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.examples.map(example => example.id);
      } else {
        this.selectedIds = [];
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
  grid-template-columns: 40px 1fr 1fr 1fr 1fr 1fr 1fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 1fr 1fr 1fr;
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

.single-select {
  margin-top: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
}

.single-select .select-item {
  padding: 8px 12px;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: background-color 0.2s;
}

.single-select .select-item:hover {
  background-color: #eee;
}

.single-select .select-item.selected {
  background-color: #007bff;
  color: white;
}
</style>