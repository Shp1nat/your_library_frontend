<template>
  <div class="editor-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Редактор экземпляров</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button class="btn add" @click="openNewExampleModal">Добавить экземпляр</button>
        <button
            class="btn delete-selected"
            @click="deleteSelectedExamples"
            :disabled="!selectedIds.length"
        >Удалить выбранные</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        </div>
        <div class="cell image-cell">Фото</div>  <div class="cell">
        Название книги
        <input
            v-model="searchFields.exampleName"
            @input="loadExamples"
            placeholder="Поиск..."
            class="header-filter-input"
        />
      </div>
        <div class="cell year-column">
          <div class="column-header sortable" @click="toggleYearSort">
            <span style="margin-right: 0.3rem;">Год</span>
            <span v-if="sortField === 'year'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
          <div class="filter-range">
            <input
                type="number"
                v-model="searchFields.year_from"
                @input="loadExamples"
                placeholder="От"
            />
            <input
                type="number"
                v-model="searchFields.year_to"
                @input="loadExamples"
                placeholder="До"
            />
          </div>
        </div>
        <div class="cell available-column">
          <div class="column-header sortable" @click="toggleAvailableCountSort">
            <span style="margin-right: 0.3rem;">Доступно</span>
            <span v-if="sortField === 'availableCount'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
          <div class="filter-range">
            <input
                type="number"
                v-model="searchFields.availableCount_from"
                @input="loadExamples"
                placeholder="От"
            />
            <input
                type="number"
                v-model="searchFields.availableCount_to"
                @input="loadExamples"
                placeholder="До"
            />
          </div>
        </div>
        <div class="cell">
          Издательство
          <input
              v-model="searchFields.publisherName"
              @input="loadExamples"
              placeholder="Поиск..."
              class="header-filter-input"
          />
        </div>
        <div class="cell sortable" @click="toggleUpdatedAtSort">
          Последнее изменение
          <span v-if="sortField === 'updatedAt'" style="margin-left: 0.3rem;">{{
              sortDir === 'asc' ? '↑' : '↓'
            }}</span>
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
        <div class="cell image-cell">  <img
            :src="example.picture ? 'data:image/jpeg;base64,' + example.picture : defaultExampleAvatar"
            alt="Обложка экземпляра"
            class="example-image"
        />
        </div>
        <div class="cell">{{ example.book?.name }}</div>
        <div class="cell">{{ example.year }}</div>
        <div class="cell">{{ example.availableCount }}</div>
        <div class="cell">{{ example.publisher?.name }}</div>
        <div class="cell">{{ formatDate(example.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedExample" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="avatar-wrapper">
          <img
              :src="selectedExample.picture ? 'data:image/jpeg;base64,' + selectedExample.picture : defaultExampleAvatar"
              alt="Обложка экземпляра"
              class="avatar-preview"
          />
          <label class="upload-avatar-button">
            Загрузить фото
            <input type="file" @change="onAvatarChange" hidden />
          </label>
          <button
              v-if="selectedExample.picture"
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
          <label>Доступно:</label>
          <input type="number" v-model="selectedExample.availableCount" />
        </div>

        <div class="form-group">
          <label>Книга:</label>
          <input v-model="bookSearch" @input="searchBooks" placeholder="Поиск книги..." />
          <div class="single-select">
            <div
                v-for="book in availableBooks"
                :key="book.id"
                class="select-item"
                @click="selectSingleBook(book)"
                :class="{ selected: selectedExample.book?.id === book.id }"
            >
              {{ book.name }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Издательство:</label>
          <input
              v-model="publisherSearch"
              @input="searchPublishers"
              placeholder="Поиск издательства..."
          />
          <div class="single-select">
            <div
                v-for="publisher in availablePublishers"
                :key="publisher.id"
                class="select-item"
                @click="selectSinglePublisher(publisher)"
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
import defaultExampleAvatar from '@/assets/defaultExampleAvatar.jpg';
export default {
  data() {
    return {
      examples: [],
      selectedExample: null,
      isCreatingNew: false,
      sortDir: 'desc',
      sortField: 'updatedAt',
      selectedIds: [],
      searchFields: {
        exampleName: '',
        year_from: '',
        year_to: '',
        availableCount_from: '',
        availableCount_to: '',
        publisherName: ''
      },
      errorMessage: '',

      availableBooks: [],
      availablePublishers: [],

      bookSearch: '',
      publisherSearch: '',

      defaultExampleAvatar,
      avatarChanged: false,
      avatarUploadMessage: '',
    };
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
    formatDate(dateStr) {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString();
    },
    onAvatarChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedExample.avatarFile = file;
        this.avatarChanged = true;
        this.avatarUploadMessage = 'Изображение загружено ✅';
        const reader = new FileReader();
        reader.onload = e => {
          // reader.result = "data:image/…;base64,AAAA…"
          this.selectedExample.picture = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
      }
    },
    removeAvatar() {
      this.selectedExample.picture = null;
      this.selectedExample.avatarFile = null;
      this.avatarChanged = true;
      this.avatarUploadMessage = 'Изображение удалено ❌';
    },
    async loadExamples() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      const conditions = [];

      if (this.searchFields.exampleName) {
        conditions.push({var: 'name', operator: 'contain', value: this.searchFields.exampleName});
      }
      if (this.searchFields.year_from !== '' && this.searchFields.year_from !== null) {
        conditions.push({var: 'year', operator: 'greater_or_equal', value: parseInt(this.searchFields.year_from, 10)});
      }
      if (this.searchFields.year_to !== '' && this.searchFields.year_to !== null) {
        conditions.push({var: 'year', operator: 'less_or_equal', value: parseInt(this.searchFields.year_to, 10)});
      }
      if (this.searchFields.availableCount_from !== '' && this.searchFields.availableCount_from !== null) {
        conditions.push({
          var: 'availableCount',
          operator: 'greater_or_equal',
          value: parseInt(this.searchFields.availableCount_from, 10)
        });
      }
      if (this.searchFields.availableCount_to !== '' && this.searchFields.availableCount_to !== null) {
        conditions.push({
          var: 'availableCount',
          operator: 'less_or_equal',
          value: parseInt(this.searchFields.availableCount_to, 10)
        });
      }
      if (this.searchFields.publisherName) {
        conditions.push({var: 'publisherName', operator: 'contain', value: this.searchFields.publisherName});
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
            sort_col: this.sortField,
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
    toggleYearSort() {
      if (this.sortField === 'year') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'year';
        this.sortDir = 'asc';
      }
      this.loadExamples();
    },
    toggleAvailableCountSort() {
      if (this.sortField === 'availableCount') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'availableCount';
        this.sortDir = 'asc';
      }
      this.loadExamples();
    },
    toggleUpdatedAtSort() {
      if (this.sortField === 'updatedAt') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'updatedAt';
        this.sortDir = 'desc';
      }
      this.loadExamples();
    },
    async selectExample(id) {
      this.errorMessage = '';
      this.avatarUploadMessage = '';
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/proxy/get-example-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({example: {id}})
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.selectedExample = data.result.example;
          this.isCreatingNew = false;
          if (this.selectedExample.book) {
            this.availableBooks = [this.selectedExample.book];
            this.bookSearch = this.selectedExample.book.name || '';
          } else {
            this.availableBooks = [];
            this.bookSearch = '';
          }

          if (this.selectedExample.publisher) {
            this.availablePublishers = [this.selectedExample.publisher];
            this.publisherSearch = this.selectedExample.publisher.name || '';
          } else {
            this.availablePublishers = [];
            this.publisherSearch = '';
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
        year: new Date().getFullYear(),
        availableCount: 1,
        book: null,
        publisher: null
      };
      this.isCreatingNew = true;
      this.bookSearch = '';
      this.publisherSearch = '';
      this.availableBooks = [];
      this.availablePublishers = [];
    },
    closeModal() {
      this.selectedExample = null;
      this.isCreatingNew = false;
    },
    async saveExample() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Ошибка: токен отсутствует';
        return;
      }

      // вместо JSON — FormData
      const formData = new FormData();
      // отправляем остальные поля экземпляра в виде JSON
      formData.append('example', JSON.stringify({
          id: this.selectedExample.id,
          description: this.selectedExample.description,
          year: this.selectedExample.year,
          availableCount: this.selectedExample.availableCount,
          book: this.selectedExample.book,
          publisher: this.selectedExample.publisher
      }));
      formData.append('avatarChanged', JSON.stringify(this.avatarChanged));
      if (this.avatarChanged && this.selectedExample.avatarFile) {
        formData.append('avatar', this.selectedExample.avatarFile);
      }
      try {
        const response = await fetch('http://localhost:3000/proxy/set-example.json', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const responseJson = await response.json();
        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          await this.loadExamples();
          this.closeModal();
          this.avatarChanged = false;
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
          body: JSON.stringify({example: {id: this.selectedExample.id}})
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
          body: JSON.stringify({example: {id: this.selectedIds}})
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
            conditions: this.bookSearch ? [{var: 'name', operator: 'contain', value: this.bookSearch}] : [],
            main_cond: 'and',
            search: '',
            sort_col: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10);
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
            conditions: this.publisherSearch ? [{var: 'name', operator: 'contain', value: this.publisherSearch}] : [],
            main_cond: 'and',
            search: '',
            sort_col: 'name',
            sort_dir: 'asc'
          })
        });

        const responseJson = await response.json();
        if (responseJson.result?.rows?.length) {
          responseJson.result.rows = responseJson.result.rows.slice(0, 10);
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
    selectSingleBook(book) {
      this.selectedExample.book = book;
      this.bookSearch = book.name;
    },
    selectSinglePublisher(publisher) {
      this.selectedExample.publisher = publisher;
      this.publisherSearch = publisher.name;
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
  grid-template-columns: 40px 80px 2fr 1.5fr 1.5fr 1.5fr 1.5fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
}

.image-cell {
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.example-image {
  max-width: 60px;
  max-height: 60px;
  border-radius: 4px;
  object-fit: contain;
}

.table-header {
  background-color: #f9fafb;
  font-weight: bold;
  padding: 0.5rem;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.table-row .cell {
  padding: 0.75rem 0.5rem;
}


.table-row:hover {
  background-color: #f0f0f0;
}

.cell {
  padding: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-row .cell {
  white-space: nowrap;
}


.header-filter-input {
  margin-top: 5px;
  padding: 0.3rem 0.5rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.year-column,
.available-column {
  display: flex;
  flex-direction: column;
}

.column-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.cell > .sortable, .column-header.sortable {
  cursor: pointer;
  user-select: none;
}

.filter-range {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.filter-range input {
  width: calc(50% - 0.25rem);
  padding: 0.3rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
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
  max-height: 80vh;
  overflow-y: auto;
}

.modal h2 {
  text-align: center;
  font-size: 1.5rem;
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
textarea,
select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  resize: none;
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

.single-select {
  margin-top: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  background-color: #fff;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.avatar-preview { max-width:150px; border:2px solid #1e3a8a; border-radius:10px; }

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

.cell.sortable {
  cursor: pointer;
}

.single-select .select-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.single-select .select-item:not(.selected):hover {
  background-color: #f0f0f0;
}

.single-select .select-item.selected {
  background-color: #007bff;
  color: white;
}
</style>