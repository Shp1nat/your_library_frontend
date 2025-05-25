<template>
  <div class="order-container">
    <div class="header-row">
      <h1 class="title">Оформление заказа</h1>
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
        Загрузка данных или нет экземпляров по заданным фильтрам.
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

export default {
  data() {
    return {
      examples: [],
      selectedExample: null, // Используется для отображения в модальном окне
      sortDir: 'desc',
      sortField: 'updatedAt',
      selectedIds: [], // Массив ID выбранных чекбоксами экземпляров
      searchFields: { // Поля для фильтрации
        exampleName: '',
        year_from: '',
        year_to: '',
        availableCount_from: '',
        availableCount_to: '',
        publisherName: ''
      },
      errorMessage: '',
      isOrdering: false, // Флаг для состояния оформления заказа
      defaultExampleAvatar,
    };
  },
  computed: {
    // Получаем только доступные экземпляры
    availableExamples() {
      return this.examples.filter(example => example.availableCount > 0);
    },
    allSelected() {
      // Проверяем, выбраны ли все *доступные* экземпляры
      // И также убеждаемся, что выбранных ID больше 0, чтобы избежать ложного "все выбраны" при пустом списке
      return this.availableExamples.length > 0 &&
          this.selectedIds.length === this.availableExamples.length &&
          this.selectedIds.every(id => this.availableExamples.some(ex => ex.id === id));
    },
  },
  async mounted() {
    // Загрузка данных при монтировании компонента
    await this.loadExamples();
  },
  methods: {
    // Метод для форматирования даты, остается без изменений
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleString();
      } catch (e) {
        console.error('Invalid date string:', dateStr, e);
        return 'Некорректная дата';
      }
    },
    // Метод для загрузки экземпляров с учетом фильтров и сортировки
    async loadExamples() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.examples = [];
        return;
      }

      const conditions = [];

      // Формирование условий для запроса на основе полей поиска
      if (this.searchFields.exampleName) {
        conditions.push({ var: 'name', operator: 'contain', value: this.searchFields.exampleName });
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
      // Обработка фильтра по названию книги (в оригинале было exampleName, но фильтруем по book.name)
      // Предполагаем, что API `get-example-ids.json` поддерживает фильтрацию по связанным полям через 'name' для 'book'.
      // Если нет, нужно будет изменить логику фильтрации.
      // Исходя из примера, `exampleName` используется для фильтрации по названию книги.
      if (this.searchFields.exampleName) {
        conditions.push({ var: 'book.name', operator: 'contain', value: this.searchFields.exampleName });
      }
      // Фильтрация по издательству (publisher.name)
      if (this.searchFields.publisherName) {
        conditions.push({ var: 'publisher.name', operator: 'contain', value: this.searchFields.publisherName });
      }

      try {
        // Шаг 1: Получение ID экземпляров по условиям
        const idResponse = await fetch('http://localhost:3000/proxy/get-example-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'and', // Используем 'and' для комбинирования фильтров
            search: '', // Пустой общий поиск, т.к. используем пополевые фильтры
            sort_col: this.sortField,
            sort_dir: this.sortDir,
          }),
        });

        const idResponseJson = await idResponse.json();

        if (idResponseJson.error) {
          this.errorMessage = idResponseJson.error;
          this.examples = [];
          return; // Прерываем выполнение при ошибке
        }

        // Проверяем, есть ли ID для получения детальных данных
        if (!idResponseJson.result?.rows?.length) {
          this.examples = [];
          // Сброс выбранных ID, оставляем только те, которых нет в новом пустом списке (т.е. ничего)
          this.selectedIds = this.selectedIds.filter(id => this.examples.some(ex => ex.id === id));
          return; // Если ID нет, завершаем
        }

        // Шаг 2: Получение детальных данных по полученным ID
        const examplesRes = await fetch('http://localhost:3000/proxy/get-example-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          // Отправляем только result из первого запроса, как в оригинале
          body: JSON.stringify(idResponseJson.result),
        });

        const examplesData = await examplesRes.json();
        if (examplesData.error) {
          this.errorMessage = examplesData.error;
          this.examples = [];
        } else {
          this.examples = examplesData.result.rows || [];
          // Сброс выбранных ID, оставляем только те, которые есть в новом списке
          this.selectedIds = this.selectedIds.filter(id => this.examples.some(ex => ex.id === id));
        }
      } catch (err) {
        console.error('Ошибка при загрузке экземпляров:', err);
        this.errorMessage = 'Ошибка подключения к серверу или получения данных';
        this.examples = [];
      } finally {
        // После загрузки данных, убедимся, что выбранные ID соответствуют доступным
        this.selectedIds = this.selectedIds.filter(id =>
            this.examples.some(ex => ex.id === id && ex.availableCount > 0)
        );
      }
    },
    // Методы сортировки, остаются без изменений
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
        this.sortDir = 'desc'; // Дефолтная сортировка по дате изменения чаще всего убывающая
      }
      this.loadExamples();
    },
    // Метод для просмотра деталей (открывает модальное окно)
    async viewExampleDetails(id) { // Переименован из selectExample
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }
      try {
        // Запрос на получение данных конкретного экземпляра
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
          this.errorMessage = 'Детали экземпляра не найдены.';
          this.selectedExample = null;
        }
      } catch (err) {
        console.error('Ошибка при получении деталей экземпляра:', err);
        this.errorMessage = 'Ошибка подключения к серверу при получении деталей';
        this.selectedExample = null;
      }
    },
    // Метод для закрытия модального окна
    closeModal() {
      this.selectedExample = null;
    },
    // Метод для выбора/снятия выбора всех чекбоксов (только для доступных)
    toggleSelectAll(event) {
      if (event.target.checked) {
        // Выбираем ID только тех экземпляров, у которых availableCount > 0
        this.selectedIds = this.availableExamples.map(example => example.id);
      } else {
        this.selectedIds = [];
      }
    },
    // Новый метод для оформления заказа
    async placeOrder() {
      if (!this.selectedIds.length || this.isOrdering) {
        return; // Не делаем ничего, если ничего не выбрано или уже идет процесс
      }

      this.errorMessage = '';
      this.isOrdering = true; // Устанавливаем флаг, чтобы отключить кнопку
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
          // В теле запроса отправляем массив выбранных ID
          body: JSON.stringify({ exampleIds: this.selectedIds }),
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          // Заказ успешно оформлен
          console.log('Заказ успешно оформлен:', responseJson.result);
          // Очищаем выбранные ID
          this.selectedIds = [];
          // Обновляем список экземпляров
          await this.loadExamples();
          // Можно добавить сообщение об успехе, если нужно
          // alert('Заказ успешно оформлен!');
        }
      } catch (err) {
        console.error('Ошибка при оформлении заказа:', err);
        this.errorMessage = 'Ошибка подключения к серверу при оформлении заказа.';
      } finally {
        this.isOrdering = false; // Снимаем флаг независимо от результата
      }
    },
  },
};
</script>

<style scoped>
/* Используем тот же базовый стиль, что и в редакторе, с дополнениями для фото */
.order-container {
  padding: 2rem;
  font-family: sans-serif; /* Убедимся, что используется стандартный шрифт */
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
  animation: fadeIn 0.3s ease; /* Анимация появления */
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
  color: #1f2937; /* Темно-серый текст */
}

/* Стили кнопок */
.btn {
  background-color: #f3f4f6; /* Светло-серый фон */
  color: #1f2937; /* Темно-серый текст */
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #d1d5db; /* Серый бордер */
  cursor: pointer;
  transition: all 0.2s ease; /* Плавный переход для анимации */
  user-select: none; /* Предотвратить выделение текста при клике */
}

.btn:hover {
  transform: scale(1.05); /* Легкое увеличение при наведении */
}

/* Специфичный стиль для кнопки "Оформить заказ" */
.btn.order {
  background-color: #2563eb; /* Синий фон */
  color: white;
  border-color: #2563eb;
}

.btn.order:hover:not(:disabled) {
  background-color: #3b82f6; /* Более светлый синий при наведении */
  border-color: #3b82f6;
  transform: scale(1.05); /* Сохраняем анимацию */
}

.btn:disabled {
  opacity: 0.5; /* Затемнение */
  cursor: not-allowed; /* Курсор "запрещено" */
  transform: none !important; /* Отключаем анимацию при отключенной кнопке */
}

.table-container {
  border: 1px solid #d1d5db; /* Серый бордер */
  border-radius: 8px;
  overflow-x: auto; /* Прокрутка для узких экранов */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* Легкая тень */
  background-color: #fff; /* Белый фон таблицы */
}

.table-header,
.table-row {
  display: grid;
  /* Сетка колонок: чекбокс (фиксир), фото (80px), книга (2 части), год (1.5), доступно (1.5), издательство (1.5), изменение (1.5) */
  grid-template-columns: 40px 80px 2fr 1.5fr 1.5fr 1.5fr 1.5fr;
  align-items: start; /* Выравнивание по верху, чтобы фильтры не растягивали ячейку */
  border-bottom: 1px solid #e5e7eb; /* Светло-серый разделитель строк */
}

.table-header {
  background-color: #f9fafb; /* Очень светло-серый фон заголовка */
  font-weight: bold;
  padding: 0.5rem 0.75rem; /* Паддинги заголовка */
  color: #374151; /* Цвет текста заголовка */
}

.table-row {
  cursor: pointer; /* Курсор-указатель */
  transition: background-color 0.2s ease-in-out; /* Анимация фона строки */
}

.table-row:last-child {
  border-bottom: none; /* Нет бордера у последней строки */
}

/* Стиль для строки, если availableCount === 0 */
.table-row.row-disabled {
  opacity: 0.6; /* Затемнение строки */
  background-color: #fef2f2; /* Светло-красный фон */
  cursor: not-allowed; /* Курсор "запрещено" */
}

.table-row:hover:not(.row-disabled) {
  background-color: #f0f4f8; /* Более заметный фон при наведении */
}

.cell {
  padding: 0.75rem 0.75rem; /* Паддинги ячеек */
  overflow: hidden;
  text-overflow: ellipsis; /* Многоточие для длинного текста */
  white-space: nowrap; /* Предотвратить перенос текста */
  display: flex;
  flex-direction: column; /* Ячейка может содержать заголовок и фильтр */
  justify-content: center;
}

.table-header .cell {
  /* Для заголовков выравнивание по верху из-за фильтров */
  align-items: flex-start;
  justify-content: flex-start;
}

.cell.checkbox-cell {
  padding-top: 0.9rem; /* Выравнивание чекбокса по центру с текстом */
  align-items: center;
}

.header-filter-input {
  margin-top: 5px;
  padding: 0.4rem 0.6rem; /* Паддинги инпута */
  font-size: 0.9rem;
  border: 1px solid #d1d5db; /* Серый бордер */
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box; /* Учитываем паддинг и бордер в ширине */
  background-color: #fff;
  color: #374151;
}

.header-filter-input:focus {
  border-color: #3b82f6; /* Синий бордер при фокусе */
  outline: none; /* Убрать стандартный outline */
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); /* Легкая тень при фокусе */
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

/* Стили для ячейки с изображением в таблице */
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
  object-fit: contain; /* Предотвращает искажение пропорций */
}

/* Стили модального окна для просмотра */
.modal-overlay {
  position: fixed;
  inset: 0; /* Растянуть на весь экран */
  background-color: rgba(0, 0, 0, 0.6); /* Полупрозрачный темный фон */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Поверх всего остального */
  animation: fadeInOverlay 0.3s ease; /* Анимация появления фона */
}

@keyframes fadeInOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 500px; /* Шире для лучшего отображения информации */
  max-width: 90%;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4); /* Более выраженная тень */
  position: relative;
  animation: zoomInModal 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Анимация появления модалки (с отскоком) */
}

@keyframes zoomInModal {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal h2 {
  text-align: center;
  font-size: 1.6rem; /* Немного крупнее заголовок */
  margin-bottom: 1.8rem; /* Больше отступ снизу */
  color: #1f2937;
}

/* Стиль для обертки изображения в модальном окне */
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

/* Стиль для групп информации в модалке */
.info-group {
  margin-bottom: 1.2rem; /* Отступ между группами информации */
}

.info-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: bold; /* Жирный текст для заголовка информации */
  color: #374151;
  font-size: 0.9rem; /* Чуть меньше шрифт для заголовка */
}

.info-group p {
  margin: 0; /* Убрать стандартные отступы параграфа */
  padding: 0.6rem 0.8rem; /* Паддинги текста информации */
  border: 1px solid #e5e7eb; /* Легкий бордер */
  border-radius: 6px;
  background-color: #f9fafb; /* Светлый фон для блока информации */
  color: #1f2937;
  word-break: break-word; /* Перенос слов, если текст длинный */
  white-space: pre-wrap; /* Сохранить переносы строк в описании */
}

/* Стиль для кнопки закрытия модального окна */
.btn.close-modal-button {
  background-color: #6b7280; /* Серый фон */
  color: white;
  border-color: #6b7280;
  margin-top: 1.5rem;
  width: 100%;
}

.btn.close-modal-button:hover {
  background-color: #4a5568; /* Более темный серый при наведении */
  border-color: #4a5568;
}

/* Стили для верхней панели с кнопкой */
.top-bar {
  display: flex;
  justify-content: flex-end; /* Кнопка справа */
  margin-bottom: 1rem;
}

.button-group-right {
  display: flex;
  gap: 1rem; /* Отступ между кнопками (если бы их было больше) */
}

.empty-table-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280; /* Серый цвет текста */
  font-size: 1.1rem;
}

/* Стили для маленьких экранов */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 40px 60px 1.5fr 1fr 1fr 1fr 1.5fr; /* Скорректировать ширину колонок */
    font-size: 0.9rem; /* Уменьшить шрифт */
  }

  .example-image {
    max-width: 40px;
    max-height: 40px;
  }

  .cell {
    padding: 0.5rem; /* Уменьшить паддинги */
  }

  .header-filter-input,
  .filter-range input {
    font-size: 0.8rem; /* Уменьшить шрифт в инпутах */
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

  .info-group p {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
}

</style>