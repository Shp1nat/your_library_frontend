<template>
  <div class="orders-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Забронированные заказы</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button
            class="btn approve-selected"
            @click="approveSelectedOrders"
            :disabled="!selectedIds.length"
        >Подтвердить аренду</button>
        <button
            class="btn reject-selected"
            @click="rejectSelectedOrders"
            :disabled="!selectedIds.length"
        >Отклонить аренду</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        </div>
        <div class="cell sortable" @click="toggleSort('id')">
          ID Заказа
          <span v-if="sortField === 'id'" style="margin-left: 0.3rem;">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
        <div class="cell user-column">
          <div class="column-header">Пользователь (Логин)</div>
          <input v-model="userSearch" @input="loadBookedOrders" placeholder="Поиск по логину..." class="header-filter-input"/>
        </div>
        <div class="cell">Книги</div>
        <div class="cell sortable" @click="toggleSort('finishDate')">
          Дата завершения
          <span v-if="sortField === 'finishDate'" style="margin-left: 0.3rem;">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
      </div>

      <div
          v-for="order in orders"
          :key="order.id"
          class="table-row"
          @click="openOrderModal(order)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="order.id" v-model="selectedIds" />
        </div>
        <div class="cell">{{ order.id }}</div>
        <div class="cell">{{ order.user?.login || 'Неизвестный пользователь' }}</div>
        <div class="cell">{{ getExampleNames(order.examples) }}</div>
        <div class="cell">{{ formatDate(order.finishDate) }}</div>
      </div>
    </div>

    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Детали заказа #{{ selectedOrder.id }}</h2>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="order-details-section">
          <h3>Информация о пользователе</h3>
          <p><strong>ID:</strong> {{ selectedOrder.user?.id }}</p>
          <p><strong>Логин:</strong> {{ selectedOrder.user?.login }}</p>
          <p><strong>Имя:</strong> {{ selectedOrder.user ? `${selectedOrder.user.name} ${selectedOrder.user.lastname} ${selectedOrder.user.patronymic || ''}` : 'Неизвестно' }}</p>
          <p><strong>Возраст:</strong> {{ selectedOrder.user?.age }}</p>
          <p><strong>Штрафные баллы:</strong> {{ selectedOrder.user?.penaltyPoints }}</p>
        </div>

        <div class="order-details-section">
          <h3>Книги в заказе</h3>
          <ul>
            <li v-for="example in selectedOrder.examples" :key="example.id">
              {{ example?.name || 'Неизвестная книга' }} (ID экземпляра: {{ example.id }})
            </li>
          </ul>
        </div>

        <div class="order-details-section">
          <h3>Прочие детали</h3>
          <p><strong>Дата завершения:</strong> {{ formatDate(selectedOrder.finishDate) }}</p>
        </div>

        <div class="actions">
          <button @click="closeModal" class="btn">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      orders: [], // Массив для хранения забронированных заказов
      selectedIds: [], // Массив ID выбранных заказов
      selectedOrder: null, // Объект для хранения данных выбранного заказа для модального окна
      errorMessage: '', // Сообщение об ошибке
      sortField: 'finishDate', // Поле для сортировки по умолчанию
      sortDir: 'asc', // Направление сортировки по умолчанию
      userSearch: '', // Поле для поиска по логину пользователя
    };
  },
  computed: {
    // Вычисляемое свойство для определения, выбраны ли все заказы
    allSelected() {
      return this.orders.length > 0 && this.selectedIds.length === this.orders.length;
    }
  },
  async mounted() {
    // При загрузке компонента загружаем забронированные заказы
    await this.loadBookedOrders();
  },
  methods: {
    // Метод для форматирования даты
    formatDate(dateStr) {
      if (!dateStr) return '';
      // Используем try-catch для безопасного форматирования даты
      try {
        return new Date(dateStr).toLocaleString();
      } catch (e) {
        console.error("Ошибка форматирования даты:", e);
        return dateStr; // Возвращаем оригинальную строку, если форматирование не удалось
      }
    },
    // Метод для получения названий книг из массива экземпляров
    getExampleNames(examples) {
      if (!examples || examples.length === 0) return 'Нет книг';
      // Объединяем названия книг через запятую
      return examples.map(ex => ex?.name || 'Неизвестная книга').join(', ');
    },
    // Метод для загрузки забронированных заказов с сервера
    async loadBookedOrders() {
      this.errorMessage = ''; // Сбрасываем сообщение об ошибке
      const token = localStorage.getItem('token'); // Получаем токен из локального хранилища

      const conditions = [{ var: 'status', operator: 'equal', value: 'booked' }]; // Фильтр по статусу 'booked'

      // Добавляем условие для поиска по логину пользователя, если поле поиска не пустое
      if (this.userSearch) {
        // Предполагаем, что API поддерживает фильтрацию по полю login внутри объекта user
        conditions.push({ var: 'user.login', operator: 'contain', value: this.userSearch });
      }

      try {
        // Шаг 1: Получаем ID забронированных заказов
        const response = await fetch('http://localhost:3000/proxy/get-order-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions, // Передаем условия фильтрации и поиска
            main_cond: 'and', // Указываем логическое И для условий
            search: '', // Поиск не используется в этом случае
            sort_col: this.sortField, // Поле для сортировки
            sort_dir: this.sortDir // Направление сортировки
          })
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error;
          this.orders = []; // Очищаем список заказов при ошибке
        } else if (responseJson.result && responseJson.result.rows.length > 0) {
          // Шаг 2: Получаем полную информацию о заказах по их ID
          const ordersRes = await fetch('http://localhost:3000/proxy/get-order-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result) // Передаем результат первого запроса
          });

          const ordersData = await ordersRes.json();

          if (ordersData.error) {
            this.errorMessage = ordersData.error;
            this.orders = []; // Очищаем список заказов при ошибке
          } else {
            this.orders = ordersData.result.rows; // Сохраняем полученные данные о заказах
          }
        } else {
          this.orders = []; // Если нет заказов с таким статусом, очищаем список
        }
      } catch (err) {
        console.error('Ошибка при загрузке забронированных заказов:', err);
        this.errorMessage = 'Ошибка подключения к серверу'; // Сообщение об ошибке подключения
        this.orders = []; // Очищаем список заказов при ошибке
      }
    },
    // Метод для переключения сортировки
    toggleSort(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDir = 'asc'; // Сортировка по умолчанию по возрастанию при смене поля
      }
      this.loadBookedOrders(); // Перезагружаем данные с новой сортировкой
    },
    // Метод для открытия модального окна с деталями заказа
    openOrderModal(order) {
      this.selectedOrder = order; // Устанавливаем выбранный заказ
    },
    // Метод для закрытия модального окна
    closeModal() {
      this.selectedOrder = null; // Сбрасываем выбранный заказ
      this.errorMessage = ''; // Сбрасываем сообщение об ошибке
    },
    // Метод для выбора/снятия выбора со всех заказов
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.orders.map(order => order.id); // Выбираем все ID заказов
      } else {
        this.selectedIds = []; // Очищаем список выбранных ID
      }
    },
    // Метод для подтверждения выбранных заказов
    async approveSelectedOrders() {
      if (!this.selectedIds.length) return; // Если нет выбранных заказов, выходим
      this.errorMessage = ''; // Сбрасываем сообщение об ошибке
      const token = localStorage.getItem('token'); // Получаем токен

      try {
        const response = await fetch('http://localhost:3000/proxy/approve-order-rent.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ orderIds: this.selectedIds }) // Передаем массив ID выбранных заказов
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error; // Отображаем ошибку, если есть
        } else {
          this.selectedIds = []; // Очищаем выбранные ID после успешного выполнения
          await this.loadBookedOrders(); // Перезагружаем список заказов
        }
      } catch (err) {
        console.error('Ошибка при подтверждении заказов:', err);
        this.errorMessage = 'Ошибка подключения к серверу при подтверждении заказов'; // Сообщение об ошибке
      }
    },
    // Метод для отклонения выбранных заказов
    async rejectSelectedOrders() {
      if (!this.selectedIds.length) return; // Если нет выбранных заказов, выходим
      this.errorMessage = ''; // Сбрасываем сообщение об ошибке
      const token = localStorage.getItem('token'); // Получаем токен

      try {
        const response = await fetch('http://localhost:3000/proxy/reject-order-rent.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ orderIds: this.selectedIds }) // Передаем массив ID выбранных заказов
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error; // Отображаем ошибку, если есть
        } else {
          this.selectedIds = []; // Очищаем выбранные ID после успешного выполнения
          await this.loadBookedOrders(); // Перезагружаем список заказов
        }
      } catch (err) {
        console.error('Ошибка при отклонении заказов:', err);
        this.errorMessage = 'Ошибка подключения к серверу при отклонении заказов'; // Сообщение об ошибке
      }
    },
    // Метод для возврата на предыдущую страницу (панель управления заказами)
    goBack() {
      this.$router.push('/orders');
    }
  }
};
</script>

<style scoped>
/* Стили, адаптированные из ExamplesView.vue */
.orders-container {
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

/* Стили для кнопок действий с заказами */
.btn.approve-selected:hover {
  background-color: #10b981; /* Зеленый */
  color: white;
}

.btn.reject-selected:hover {
  background-color: #ef4444; /* Красный */
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
  /* Адаптируем колонки под данные заказа: Чекбокс, ID, Пользователь (Логин), Книги, Дата */
  grid-template-columns: 40px 1fr 2fr 3fr 1.5fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
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

/* Стили для колонки пользователя с полем поиска */
.user-column {
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
  padding: 0.3rem 0.5rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
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
  width: 500px; /* Увеличиваем ширину модального окна для деталей */
  max-width: 90%;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  max-height: 90vh; /* Ограничиваем высоту */
  overflow-y: auto; /* Добавляем прокрутку, если контент не помещается */
}

.modal h2 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.order-details-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee; /* Разделитель между секциями */
}

.order-details-section:last-child {
  border-bottom: none; /* Убираем разделитель для последней секции */
  padding-bottom: 0;
  margin-bottom: 0;
}

.order-details-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.order-details-section p,
.order-details-section li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.order-details-section ul {
  list-style: disc;
  padding-left: 1.5rem;
}


.actions {
  display: flex;
  justify-content: flex-end; /* Кнопка закрытия справа */
  margin-top: 1.5rem;
}

.sortable {
  cursor: pointer;
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

/* Дополнительные стили для лучшего отображения текста в ячейках, если он длинный */
.table-row .cell:nth-child(3), /* Пользователь */
.table-row .cell:nth-child(4) /* Книги */
{
  white-space: normal; /* Разрешаем перенос текста */
  word-break: break-word; /* Разбиваем длинные слова */
}

</style>
