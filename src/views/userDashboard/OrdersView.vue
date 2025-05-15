<template>
  <div class="orders-container">
    <div class="header-row">
      <h1 class="title">Мои заказы</h1>
    </div>

    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell status-column">
          <div class="column-header sortable" @click="toggleStatusSort">
            <span style="margin-right: 0.3rem;">Статус</span>
            <span v-if="sortField === 'status'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
          <input v-model="searchFields.status" @input="loadOrders" placeholder="Фильтр статуса..." class="header-filter-input"/>
        </div>
        <div class="cell date-column">
          <div class="column-header sortable" @click="toggleFinishDateSort">
            <span style="margin-right: 0.3rem;">Дата завершения</span>
            <span v-if="sortField === 'finishDate'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
          <div class="filter-range">
            <input type="text" v-model="searchFields.finishDate_from" @input="loadOrders" placeholder="Дата от (YYYY-MM-DD)"/>
            <input type="text" v-model="searchFields.finishDate_to" @input="loadOrders" placeholder="Дата до (YYYY-MM-DD)"/>
          </div>
        </div>
        <div class="cell">
          Книги (кол-во)
        </div>
        <div class="cell sortable" @click="toggleCreatedAtSort">
          Дата создания
          <span v-if="sortField === 'createdAt'" style="margin-left: 0.3rem;">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
      </div>

      <div v-if="isLoading" class="empty-table-message">
        Загрузка заказов...
      </div>

      <div v-if="!isLoading && !orders.length && !errorMessage" class="empty-table-message">
        У вас пока нет заказов.
      </div>

      <div
          v-for="order in orders"
          :key="order.id"
          class="table-row"
          @click="viewOrderDetails(order.id)" >
        <div class="cell">{{ order.status }}</div>
        <div class="cell">{{ formatDate(order.finishDate) }}</div>
        <div class="cell">
          {{ order.examples ? order.examples.length : 0 }} {{ order.examples && order.examples.length > 0 ? (order.examples.length === 1 ? 'книга' : (order.examples.length >=2 && order.examples.length <=4 ? 'книги' : 'книг')) : 'книг' }}
        </div>
        <div class="cell">{{ formatDate(order.createdAt) }}</div>
      </div>

    </div>

    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Детали заказа №{{ selectedOrder.id }}</h2>
        <div class="info-group">
          <label>Статус:</label>
          <p>{{ selectedOrder.status || 'Не указан' }}</p>
        </div>
        <div class="info-group">
          <label>Дата создания:</label>
          <p>{{ formatDate(selectedOrder.createdAt) || 'Не указана' }}</p>
        </div>
        <div class="info-group">
          <label>Дата завершения:</label>
          <p>{{ formatDate(selectedOrder.finishDate) || 'Не указана' }}</p>
        </div>
        <div class="info-group" v-if="selectedOrder.examples && selectedOrder.examples.length > 0">
          <label>Книги в заказе:</label>
          <ul>
            <li v-for="example in selectedOrder.examples" :key="example.id">
              {{ example.book?.name || example.name || 'Название не указано' }}
            </li>
          </ul>
        </div>
        <div class="info-group" v-else>
          <label>Книги в заказе:</label>
          <p>Список книг пуст</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserOrders', // Изменено название компонента
  data() {
    return {
      orders: [], // Теперь храним заказы
      selectedOrder: null, // Для модального окна деталей заказа
      sortDir: 'desc',
      // Поля сортировки теперь связаны с заказом. Добавим createdAt по умолчанию, если API его возвращает.
      sortField: 'createdAt', // Или 'finishDate', в зависимости от предпочтений
      searchFields: { // Поля для фильтрации заказов
        status: '',
        finishDate_from: '',
        finishDate_to: ''
        // Фильтрация по книгам внутри заказа требует поддержки на бэкенде
      },
      errorMessage: '',
      isLoading: false, // Флаг загрузки
    };
  },
  // Нет computed свойств для выбора всех, так как нет чекбоксов
  async mounted() {
    // Загрузка данных при монтировании компонента
    await this.loadOrders();
  },
  methods: {
    // Метод для форматирования даты, остается без изменений
    formatDate(dateStr) {
      if (!dateStr) return '';
      // Пробуем распарсить дату. Важно учесть возможные форматы от API.
      // Если API возвращает ISO строки, new Date() сработает хорошо.
      // Если форматы другие, возможно, потребуется сторонняя библиотека (moment.js, date-fns)
      try {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        return new Date(dateStr).toLocaleString(undefined, options); // undefined для локальных настроек
      } catch (e) {
        console.error("Invalid date string:", dateStr, e);
        return 'Некорректная дата';
      }
    },
    // Метод для загрузки заказов с учетом фильтров и сортировки
    async loadOrders() { // Переименовано
      this.errorMessage = '';
      this.isLoading = true; // Устанавливаем флаг загрузки
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.orders = [];
        this.isLoading = false;
        return;
      }

      const conditions = [];

      // Формирование условий для запроса на основе полей поиска заказов
      if (this.searchFields.status) {
        // Предполагаем, что фильтрация по статусу поддерживается оператором 'contain' или '='
        conditions.push({var: 'status', operator: 'contain', value: this.searchFields.status});
        // Если API требует точное совпадение: conditions.push({var: 'status', operator: '=', value: this.searchFields.status});
      }
      if (this.searchFields.finishDate_from) {
        // Предполагаем, что API поддерживает сравнение дат и формат YYYY-MM-DD
        conditions.push({var: 'finishDate', operator: 'greater_or_equal', value: this.searchFields.finishDate_from});
      }
      if (this.searchFields.finishDate_to) {
        conditions.push({var: 'finishDate', operator: 'less_or_equal', value: this.searchFields.finishDate_to});
      }

      try {
        // Шаг 1: Получение ID заказов по условиям
        const idResponse = await fetch('http://localhost:3000/proxy/get-user-order-ids.json', { // Новая ручка
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'and', // Используем 'and' для комбинирования фильтров
            search: '', // Пустой общий поиск
            sort_col: this.sortField, // Поле сортировки для заказов
            sort_dir: this.sortDir
          })
        });

        const idResponseJson = await idResponse.json();

        if (idResponseJson.error) {
          this.errorMessage = idResponseJson.error;
          this.orders = [];
          return; // Прерываем выполнение при ошибке
        }

        // Проверяем, есть ли ID для получения детальных данных
        if (!idResponseJson.result?.rows?.length) {
          this.orders = [];
          return; // Если ID нет, завершаем
        }

        // Шаг 2: Получение детальных данных по полученным ID
        const ordersRes = await fetch('http://localhost:3000/proxy/get-user-order-ids-out.json', { // Новая ручка
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          // Отправляем только result из первого запроса, как в оригинале
          body: JSON.stringify(idResponseJson.result)
        });

        const ordersData = await ordersRes.json();
        if (ordersData.error) {
          this.errorMessage = ordersData.error;
          this.orders = [];
        } else {
          // Предполагаем, что детальные данные заказов находятся в ordersData.result.rows
          // Или, возможно, в ordersData.result.orders, если структура отличается
          this.orders = ordersData.result.rows || ordersData.result.orders || []; // Гибкость на случай разных структур
        }
      } catch (err) {
        console.error('Ошибка при загрузке заказов:', err);
        this.errorMessage = 'Ошибка подключения к серверу или получения данных заказов';
        this.orders = [];
      } finally {
        this.isLoading = false; // Снимаем флаг загрузки
      }
    },
    // Методы сортировки для полей заказа
    toggleStatusSort() {
      if (this.sortField === 'status') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'status';
        this.sortDir = 'asc';
      }
      this.loadOrders();
    },
    toggleFinishDateSort() {
      if (this.sortField === 'finishDate') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'finishDate';
        this.sortDir = 'desc'; // Даты завершения чаще сортируют по убыванию
      }
      this.loadOrders();
    },
    toggleCreatedAtSort() { // Добавляем сортировку по дате создания
      if (this.sortField === 'createdAt') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'createdAt';
        this.sortDir = 'desc'; // Даты создания чаще сортируют по убыванию
      }
      this.loadOrders();
    },
    // Метод для просмотра деталей заказа (открывает модальное окно)
    async viewOrderDetails(id) { // Переименовано
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }
      try {
        // Запрос на получение данных конкретного заказа
        const res = await fetch('http://localhost:3000/proxy/get-user-order-ids-out.json', { // Новая ручка
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          // Передаем структуру для получения одного заказа по ID
          // Предполагаем, что ручка принимает { order: { id } } или похожую структуру
          body: JSON.stringify({ order: { id } }) // Изменено на order
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
          this.selectedOrder = null; // Убедимся, что модальное окно не откроется или закроется
        } else if (data.result?.order) {
          // Если данные получены, сохраняем их для отображения в модальном окне
          // Предполагаем, что детальный заказ находится в data.result.order
          this.selectedOrder = data.result.order;
        } else {
          this.errorMessage = 'Детали заказа не найдены.';
          this.selectedOrder = null;
        }
      } catch (err) {
        console.error('Ошибка при получении деталей заказа:', err);
        this.errorMessage = 'Ошибка подключения к серверу при получении деталей заказа';
        this.selectedOrder = null;
      }
    },
    // Метод для закрытия модального окна
    closeModal() {
      this.selectedOrder = null; // Теперь сбрасываем selectedOrder
    }
    // Метод toggleSelectAll и placeOrder удалены за ненадобностью
  }
};
</script>

<style scoped>
/* Используем тот же базовый стиль */
.orders-container { /* Изменено название контейнера */
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
  margin-bottom: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}

/* Стили кнопок оформления удалены, оставим базовые стили btn если они используются где-то еще */
/* .btn { ... } */
/* .btn.order { ... } */
/* .btn:disabled { ... } */


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
  /* Новая сетка колонок: Статус (1.5), Дата завершения (2), Книги (1.5), Дата создания (2) */
  /* Подстройте ширину по вашим нуждам */
  grid-template-columns: 1.5fr 2fr 1.5fr 2fr;
  align-items: start; /* Выравнивание по верху */
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

.table-row:hover {
  background-color: #f0f4f8;
}

.cell {
  padding: 0.75rem 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* Предотвратить перенос в ячейках таблицы */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.table-header .cell {
  align-items: flex-start;
  justify-content: flex-start;
}

/* Стили для специфичных колонок и фильтров */
.status-column,
.date-column {
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

.filter-range {
  display: flex;
  flex-direction: column; /* Изменено на column для лучшей адаптации дат */
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.filter-range input {
  width: 100%; /* Полная ширина в колонке */
  padding: 0.4rem;
  font-size: 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #fff;
  color: #374151;
}

.header-filter-input:focus,
.filter-range input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Стили модального окна */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
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

.info-group p,
.info-group ul { /* Добавлены стили для списка книг */
  margin: 0;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
  color: #1f2937;
  word-break: break-word;
  white-space: pre-wrap;
  list-style: none; /* Убираем стандартные маркеры списка */
}

.info-group ul {
  padding-left: 0.8rem; /* Добавляем небольшой отступ для списка */
  white-space: normal; /* Разрешаем перенос строк в списке книг */
}

.info-group ul li {
  margin-bottom: 0.4rem; /* Отступ между элементами списка */
  padding-left: 1.2rem; /* Отступ для маркера списка */
  position: relative;
}

.info-group ul li::before { /* Создаем кастомный маркер списка */
  content: '•'; /* Маркер - точка */
  position: absolute;
  left: 0;
  color: #374151; /* Цвет маркера */
  font-weight: bold;
}


.empty-table-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1.1rem;
}

/* Стили для маленьких экранов */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1.5fr 1fr 1.5fr; /* Скорректировать ширину колонок */
    font-size: 0.9rem;
  }

  .cell {
    padding: 0.5rem;
  }

  .header-filter-input,
  .filter-range input {
    font-size: 0.8rem;
    padding: 0.3rem;
  }

  .filter-range {
    flex-direction: column; /* Убедимся, что на маленьких экранах даты идут одна под другой */
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

  .info-group {
    margin-bottom: 1rem;
  }

  .info-group p,
  .info-group ul {
    padding: 0.5rem;
  }

  .info-group ul li {
    padding-left: 1rem; /* Меньший отступ для маркера */
  }
}

</style>