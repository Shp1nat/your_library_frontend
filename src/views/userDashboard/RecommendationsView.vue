<template>
  <div class="recommendations-container">
    <div class="header-row">
      <h1 class="title">Рекомендованные книги</h1>
    </div>

    <div class="recommendation-type-selector">
      <span class="selector-label">Показывать рекомендации по:</span>
      <div class="button-group">
        <button
            :class="['btn-recs-type', { active: recsType === 'genres' }]"
            @click="changeRecsType('genres')"
        >
          Жанрам
        </button>
        <button
            :class="['btn-recs-type', { active: recsType === 'types' }]"
            @click="changeRecsType('types')"
        >
          Типу
        </button>
        <button
            :class="['btn-recs-type', { active: recsType === 'authors' }]"
            @click="changeRecsType('authors')"
        >
          Авторам
        </button>
      </div>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button
            class="btn order"
            @click="placeOrder"
            :disabled="!selectedIds.length || isOrdering"
        >
          <span v-if="isOrdering">Оформление...</span>
          <span v-else>Оформить заказ ({{ selectedIds.length }})</span>
        </button>
      </div>
    </div>

    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell">
          <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleSelectAll"
              :disabled="availableExamples.length === 0"
          />
        </div>
        <div class="cell image-cell">Фото</div>
        <div class="cell">
          Название книги
          <input
              v-model="searchFields.exampleName"
              @input="loadRecommendedExamples"
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
                @input="loadRecommendedExamples"
                placeholder="От"
            />
            <input
                type="number"
                v-model="searchFields.year_to"
                @input="loadRecommendedExamples"
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
                @input="loadRecommendedExamples"
                placeholder="От"
            />
            <input
                type="number"
                v-model="searchFields.availableCount_to"
                @input="loadRecommendedExamples"
                placeholder="До"
            />
          </div>
        </div>
        <div class="cell">
          Издательство
          <input
              v-model="searchFields.publisherName"
              @input="loadRecommendedExamples"
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
          :class="{ 'row-disabled': example.availableCount === 0 }"
          @click="viewExampleDetails(example.id)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input
              type="checkbox"
              :value="example.id"
              v-model="selectedIds"
              :disabled="example.availableCount === 0"
          />
        </div>
        <div class="cell image-cell">
          <img
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

      <div v-if="!examples.length && !errorMessage" class="empty-table-message">
        Рекомендации пусты.
      </div>
    </div>

    <div v-if="selectedExample" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Информация о экземпляре</h2>
        <div class="modal-image-wrapper">
          <img
              :src="selectedExample.picture ? 'data:image/jpeg;base64,' + selectedExample.picture : defaultExampleAvatar"
              alt="Обложка экземпляра"
              class="modal-example-image"
          />
        </div>
        <div class="info-group">
          <label>Название книги:</label>
          <p>{{ selectedExample.book?.name || 'Не указано' }}</p>
        </div>
        <div class="info-group">
          <label>Авторы:</label>
          <div v-if="selectedExample.book?.authors?.length > 0" class="authors-list">
            <div v-for="author in selectedExample.book.authors" :key="author.id" class="author-item">
              <img
                  :src="author.picture ? 'data:image/jpeg;base64,' + author.picture : defaultAuthorAvatar"
                  alt="Фото автора"
                  class="author-avatar-modal"
              />
              <span>{{ author.lastname }} {{ author.name }} {{ author.patronymic }}</span>
            </div>
          </div>
          <p v-else>Не указано</p>
        </div>
        <div class="info-group">
          <label>Жанры:</label>
          <p v-if="selectedExample.book?.genres?.length > 0">
            <span v-for="(genre, index) in selectedExample.book.genres" :key="genre.id">
              {{ genre.name }}<span v-if="index < selectedExample.book.genres.length - 1">, </span>
            </span>
          </p>
          <p v-else>Не указано</p>
        </div>
        <div class="info-group">
          <label>Типы:</label>
          <p v-if="selectedExample.book?.types?.length > 0">
            <span v-for="(type, index) in selectedExample.book.types" :key="type.id">
              {{ type.name }}<span v-if="index < selectedExample.book.types.length - 1">, </span>
            </span>
          </p>
          <p v-else>Не указано</p>
        </div>
        <div class="info-group">
          <label>Описание:</label>
          <p>{{ selectedExample.description || 'Нет описания' }}</p>
        </div>
        <div class="info-group">
          <label>Год:</label>
          <p>{{ selectedExample.year || 'Не указан' }}</p>
        </div>
        <div class="info-group">
          <label>Доступно:</label>
          <p>{{ selectedExample.availableCount ?? 'Нет данных' }}</p>
        </div>
        <div class="info-group">
          <label>Издательство:</label>
          <p>{{ selectedExample.publisher?.name || 'Не указано' }}</p>
        </div>
        <div class="info-group">
          <label>Последнее изменение:</label>
          <p>{{ formatDate(selectedExample.updatedAt) || 'Нет данных' }}</p>
        </div>
        <button class="btn close-modal-button" @click="closeModal">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import defaultExampleAvatar from '@/assets/defaultExampleAvatar.jpg';
import defaultAuthorAvatar from '@/assets/defaultAuthorAvatar.jpg'; // Импорт аватара автора

export default {
  name: 'RecommendedBooksPage',
  data() {
    return {
      examples: [],
      selectedExample: null,
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
      isOrdering: false,
      defaultExampleAvatar,
      defaultAuthorAvatar, // Добавляем в данные
      recsType: 'genres',
    };
  },
  computed: {
    availableExamples() {
      return this.examples.filter(example => example.availableCount > 0);
    },
    allSelected() {
      return this.availableExamples.length > 0 &&
          this.selectedIds.length === this.availableExamples.length &&
          this.selectedIds.every(id => this.availableExamples.some(ex => ex.id === id));
    },
  },
  async mounted() {
    await this.loadRecommendedExamples();
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleString();
      } catch (e) {
        console.error('Invalid date string:', dateStr, e);
        return 'Некорректная дата';
      }
    },

    changeRecsType(newType) {
      if (this.recsType !== newType) {
        this.recsType = newType;
        this.loadRecommendedExamples();
      }
    },

    async loadRecommendedExamples() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.examples = [];
        return;
      }

      const conditions = [];
      conditions.push({ var: 'recsType', operator: 'equal', value: this.recsType });

      if (this.searchFields.exampleName) {
        // Предполагаем, что бэкенд может искать по book.name через 'name' в условиях для get-example-ids
        conditions.push({ var: 'book.name', operator: 'contain', value: this.searchFields.exampleName });
      }
      if (this.searchFields.year_from !== '' && this.searchFields.year_from !== null) {
        const yearFrom = parseInt(this.searchFields.year_from, 10);
        if (!isNaN(yearFrom)) conditions.push({ var: 'year', operator: 'greater_or_equal', value: yearFrom });
      }
      if (this.searchFields.year_to !== '' && this.searchFields.year_to !== null) {
        const yearTo = parseInt(this.searchFields.year_to, 10);
        if (!isNaN(yearTo)) conditions.push({ var: 'year', operator: 'less_or_equal', value: yearTo });
      }
      if (this.searchFields.availableCount_from !== '' && this.searchFields.availableCount_from !== null) {
        const countFrom = parseInt(this.searchFields.availableCount_from, 10);
        if (!isNaN(countFrom)) {
          conditions.push({ var: 'availableCount', operator: 'greater_or_equal', value: countFrom });
        }
      }
      if (this.searchFields.availableCount_to !== '' && this.searchFields.availableCount_to !== null) {
        const countTo = parseInt(this.searchFields.availableCount_to, 10);
        if (!isNaN(countTo)) {
          conditions.push({ var: 'availableCount', operator: 'less_or_equal', value: countTo });
        }
      }
      if (this.searchFields.publisherName) {
        // Предполагаем, что бэкенд может искать по publisher.name через 'publisherName' или 'publisher.name'
        conditions.push({ var: 'publisher.name', operator: 'contain', value: this.searchFields.publisherName });
      }

      try {
        const idResponse = await fetch('http://localhost:3000/proxy/get-example-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'and',
            search: '',
            sort_col: this.sortField,
            sort_dir: this.sortDir,
          }),
        });

        const idResponseJson = await idResponse.json();

        if (idResponseJson.error) {
          this.errorMessage = idResponseJson.error;
          this.examples = [];
          return;
        }

        if (!idResponseJson.result?.rows?.length) {
          this.examples = [];
          this.selectedIds = this.selectedIds.filter(id => this.examples.some(ex => ex.id === id));
          return;
        }

        const examplesRes = await fetch('http://localhost:3000/proxy/get-example-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(idResponseJson.result),
        });

        const examplesData = await examplesRes.json();
        if (examplesData.error) {
          this.errorMessage = examplesData.error;
          this.examples = [];
        } else {
          this.examples = examplesData.result.rows || [];
          this.selectedIds = this.selectedIds.filter(id => this.examples.some(ex => ex.id === id));
        }
      } catch (err) {
        console.error('Ошибка при загрузке рекомендуемых экземпляров:', err);
        this.errorMessage = 'Ошибка подключения к серверу или получения данных';
        this.examples = [];
      } finally {
        this.selectedIds = this.selectedIds.filter(id =>
            this.examples.some(ex => ex.id === id && ex.availableCount > 0)
        );
      }
    },

    toggleYearSort() {
      if (this.sortField === 'year') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'year';
        this.sortDir = 'asc';
      }
      this.loadRecommendedExamples();
    },

    toggleAvailableCountSort() {
      if (this.sortField === 'availableCount') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'availableCount';
        this.sortDir = 'asc';
      }
      this.loadRecommendedExamples();
    },

    toggleUpdatedAtSort() {
      if (this.sortField === 'updatedAt') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'updatedAt';
        this.sortDir = 'desc';
      }
      this.loadRecommendedExamples();
    },

    async viewExampleDetails(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/proxy/get-example-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ example: { id } }),
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
        } else if (data.result?.example) {
          this.selectedExample = data.result.example;
        } else {
          this.selectedExample = (data.result?.rows && data.result.rows.find(e => e.id === id)) || null;
          if (!this.selectedExample) {
            this.errorMessage = 'Детали экземпляра не найдены.';
          }
        }
      } catch (err) {
        console.error('Ошибка при получении деталей экземпляра:', err);
        this.errorMessage = 'Ошибка подключения к серверу при получении деталей';
        this.selectedExample = null;
      }
    },

    closeModal() {
      this.selectedExample = null;
    },

    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.availableExamples.map(example => example.id);
      } else {
        this.selectedIds = [];
      }
    },

    async placeOrder() {
      if (!this.selectedIds.length || this.isOrdering) {
        return;
      }

      this.errorMessage = '';
      this.isOrdering = true;
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.isOrdering = false;
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/make-order.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ exampleIds: this.selectedIds }),
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          console.log('Заказ успешно оформлен:', responseJson.result);
          this.selectedIds = [];
          await this.loadRecommendedExamples();
        }
      } catch (err) {
        console.error('Ошибка при оформлении заказа:', err);
        this.errorMessage = 'Ошибка подключения к серверу при оформлении заказа.';
      } finally {
        this.isOrdering = false;
      }
    },
  },
};
</script>

<style scoped>
.recommendations-container {
  padding: 2rem;
  font-family: sans-serif;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}

.recommendation-type-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.selector-label {
  margin-right: 1rem;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.btn-recs-type {
  background-color: #fff;
  color: #374151;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  border: none;
  border-right: 1px solid #d1d5db;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-weight: 500;
}

.btn-recs-type:last-child {
  border-right: none;
}

.btn-recs-type:hover {
  background-color: #f0f4f8;
}

.btn-recs-type.active {
  background-color: #2563eb;
  color: white;
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
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
  user-select: none;
}

.btn:hover {
  transform: scale(1.05);
}

.btn.order {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn.order:hover:not(:disabled) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  transform: scale(1.05);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.table-container {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 40px 80px 2fr 1.5fr 1.5fr 1.5fr 1.5fr;
  align-items: start;
  border-bottom: 1px solid #e5e7eb;
}

.table-header {
  background-color: #f9fafb;
  font-weight: bold;
  padding: 0.5rem 0.75rem;
  color: #374151;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.row-disabled {
  opacity: 0.6;
  background-color: #fef2f2;
  cursor: not-allowed;
}

.table-row:hover:not(.row-disabled) {
  background-color: #f0f4f8;
}

.cell {
  padding: 0.75rem 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.table-header .cell {
  align-items: flex-start;
  justify-content: flex-start;
}

.cell.checkbox-cell {
  padding-top: 0.9rem;
  align-items: center;
}

.header-filter-input {
  margin-top: 5px;
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
  color: #374151;
}

.header-filter-input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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

.cell > .sortable,
.column-header.sortable {
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
  padding: 0.4rem;
  font-size: 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #fff;
  color: #374151;
}

.filter-range input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  z-index: 1000;
  animation: fadeInOverlay 0.3s ease;
}

@keyframes fadeInOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 500px;
  max-width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  position: relative;
  animation: zoomInModal 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

@keyframes zoomInModal {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal h2 {
  text-align: center;
  font-size: 1.6rem;
  margin-bottom: 1.8rem;
  color: #1f2937;
}

.modal-image-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.modal-example-image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: contain;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
}

.info-group {
  margin-bottom: 1.2rem;
}

.info-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: bold;
  color: #374151;
  font-size: 0.9rem;
}

.info-group > p, .authors-list { /* Объединенный стиль для p и authors-list */
  margin: 0;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
  color: #1f2937;
  word-break: break-word;
}
.info-group > p { /* Специфично для p, если он используется не для списка авторов */
  white-space: pre-wrap;
}

.authors-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.author-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar-modal {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #d1d5db;
}

.btn.close-modal-button {
  background-color: #6b7280;
  color: white;
  border-color: #6b7280;
  margin-top: 1.5rem;
  width: 100%;
}

.btn.close-modal-button:hover {
  background-color: #4a5568;
  border-color: #4a5568;
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

.empty-table-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .recommendation-type-selector {
    flex-direction: column;
    align-items: stretch;
  }
  .selector-label {
    margin-bottom: 0.75rem;
    text-align: center;
  }
  .button-group {
    justify-content: center;
  }
  .btn-recs-type {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
    flex-grow: 1;
    text-align: center;
  }

  .table-header,
  .table-row {
    grid-template-columns: 40px 60px 1.5fr 1fr 1fr 1fr 1.5fr;
    font-size: 0.9rem;
  }

  .example-image {
    max-width: 40px;
    max-height: 40px;
  }

  .cell {
    padding: 0.5rem;
  }

  .header-filter-input,
  .filter-range input {
    font-size: 0.8rem;
    padding: 0.3rem;
  }

  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .modal {
    padding: 1.5rem;
    max-height: 90vh;
  }

  .modal h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .modal-example-image {
    max-width: 100px;
    max-height: 100px;
  }

  .info-group {
    margin-bottom: 1rem;
  }

  .info-group > p, .authors-list {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  .author-avatar-modal {
    width: 35px;
    height: 35px;
  }
}
</style>