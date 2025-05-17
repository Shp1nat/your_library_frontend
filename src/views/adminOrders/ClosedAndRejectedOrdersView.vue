<template>
  <div class="orders-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Завершенные заказы</h1> </div>

    <div class="top-bar">
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell sortable" @click="toggleSort('id')">
          ID Заказа
          <span v-if="sortField === 'id'" style="margin-left: 0.3rem;">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
        <div class="cell user-column">
          <div class="column-header">Пользователь (Логин)</div>
          <input v-model="userSearch" @input="loadCompletedOrders" placeholder="Поиск по логину..." class="header-filter-input"/> </div>
        <div class="cell book-column"> <div class="column-header">Книги</div> <input v-model="bookSearch" @input="loadCompletedOrders" placeholder="Поиск по названию..." class="header-filter-input"/> </div>
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
      orders: [],
      selectedOrder: null,
      errorMessage: '',
      sortField: 'finishDate',
      sortDir: 'asc',
      userSearch: '',
      bookSearch: '',
    };
  },
  computed: {
    // allSelected вычисляемое свойство удалено
  },
  async mounted() {
    await this.loadCompletedOrders();
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleString();
      } catch (e) {
        console.error("Ошибка форматирования даты:", e);
        return dateStr;
      }
    },
    getExampleNames(examples) {
      if (!examples || examples.length === 0) return 'Нет книг';
      return examples.map(ex => ex?.name || 'Неизвестная книга').join(', ');
    },
    async loadCompletedOrders() {
      this.errorMessage = '';
      const token = localStorage.getItem('token');

      const conditions = [
        {
          main_cond: 'or',
          conditions: [
            { var: 'status', operator: 'equal', value: 'closed' },
            { var: 'status', operator: 'equal', value: 'rejected' }
          ]
        }
      ];

      if (this.userSearch) {
        conditions.push({ var: 'userLogin', operator: 'contain', value: this.userSearch });
      }

      if (this.bookSearch) {
        conditions.push({ var: 'bookName', operator: 'contain', value: this.bookSearch });
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/get-order-ids.json', {
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
          this.orders = [];
        } else if (responseJson.result && responseJson.result.rows.length > 0) {
          const ordersRes = await fetch('http://localhost:3000/proxy/get-order-ids-out.json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(responseJson.result)
          });

          const ordersData = await ordersRes.json();

          if (ordersData.error) {
            this.errorMessage = ordersData.error;
            this.orders = [];
          } else {
            this.orders = ordersData.result.rows;
          }
        } else {
          this.orders = [];
        }
      } catch (err) {
        console.error('Ошибка при загрузке завершенных заказов:', err);
        this.errorMessage = 'Ошибка подключения к серверу';
        this.orders = [];
      }
    },
    toggleSort(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDir = 'asc';
      }
      this.loadCompletedOrders();
    },
    openOrderModal(order) {
      this.selectedOrder = order;
    },
    closeModal() {
      this.selectedOrder = null;
      this.errorMessage = '';
    },
    // toggleSelectAll метод удален
    // extendSelectedOrders метод удален
    // confirmReturnSelectedOrders метод удален
    goBack() {
      this.$router.push('/orders');
    }
  }
};
</script>

<style scoped>
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

/* Стили для кнопок действий удалены, остался только back-button */
/* .btn.approve-selected:hover, .btn.reject-selected:hover удалены */


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
  /* Удалена первая колонка для чекбоксов */
  display: grid;
  grid-template-columns: 1fr 2fr 3fr 1.5fr;
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

.user-column,
.book-column {
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
  width: 500px;
  max-width: 90%;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.order-details-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.order-details-section:last-child {
  border-bottom: none;
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
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.sortable {
  cursor: pointer;
}

.top-bar {
  /*top-bar остался, но пустой, можно его удалить или оставить*/
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
/* button-group-right удален */


/* Индексы ячеек в grid поменялись из-за удаления первой колонки */
.table-row .cell:nth-child(2), /* Был 3-й (Пользователь), стал 2-й */
.table-row .cell:nth-child(3) { /* Был 4-й (Книги), стал 3-й */
  white-space: normal;
  word-break: break-word;
}

</style>