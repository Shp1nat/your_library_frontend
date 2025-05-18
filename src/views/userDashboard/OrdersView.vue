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
          <div class="status-filter-checkboxes">
            <div v-for="(russianName, englishName) in statusMap" :key="englishName">
              <input
                  type="checkbox"
                  :id="'status-' + englishName"
                  v-model="selectedStatuses[englishName]"
                  @change="loadOrders"
              />
              <label :for="'status-' + englishName">{{ russianName }}</label>
            </div>
          </div>
        </div>
        <div class="cell date-column">
          <div class="column-header sortable" @click="toggleFinishDateSort">
            <span style="margin-right: 0.3rem;">Дата завершения</span>
            <span v-if="sortField === 'finishDate'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
        </div>
        <div class="cell">
          Книги (кол-во)
        </div>
        <div class="cell sortable" @click="toggleCreatedAtSort">
          <div class="column-header">
            <span style="margin-right: 0.3rem;">Дата создания</span>
            <span v-if="sortField === 'createdAt'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
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
        <div class="cell" :class="'status-' + order.status">{{ getStatusDisplayName(order.status) }}</div>
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
          <p :class="'status-' + selectedOrder.status">{{ getStatusDisplayName(selectedOrder.status) || 'Не указан' }}</p>
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
  name: 'UserOrders',
  data() {
    return {
      orders: [],
      selectedOrder: null,
      sortDir: 'desc',
      sortField: 'createdAt',
      searchFields: {},
      statusMap: {
        'active': 'Активен',
        'rejected': 'Отклонен',
        'closed': 'Закрыт',
        'booked': 'Забронирован',
      },
      selectedStatuses: {
        'active': true,
        'rejected': true,
        'closed': true,
        'booked': true,
      },
      errorMessage: '',
      isLoading: false,
    };
  },
  async mounted() {
    await this.loadOrders();
  },
  methods: {
    getStatusDisplayName(status) {
      return this.statusMap[status] || status || 'Неизвестный статус';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        return new Date(dateStr).toLocaleString(undefined, options);
      } catch (e) {
        console.error("Invalid date string:", dateStr, e);
        return 'Некорректная дата';
      }
    },
    async loadOrders() {
      this.errorMessage = '';
      this.isLoading = true;
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.orders = [];
        this.isLoading = false;
        return;
      }

      const conditions = [];

      const selectedStatusValues = Object.keys(this.selectedStatuses).filter(key => this.selectedStatuses[key]);

      if (selectedStatusValues.length > 0) {
        selectedStatusValues.forEach(status => {
          conditions.push({ var: 'status', operator: 'contain', value: status });
        });
      }

      try {
        const idResponse = await fetch('http://localhost:3000/proxy/get-user-order-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions,
            main_cond: 'or',
            search: '',
            sort_col: this.sortField,
            sort_dir: this.sortDir
          })
        });

        const idResponseJson = await idResponse.json();

        if (idResponseJson.error) {
          this.errorMessage = idResponseJson.error;
          this.orders = [];
          return;
        }

        if (!idResponseJson.result?.rows?.length) {
          this.orders = [];
          return;
        }

        const ordersRes = await fetch('http://localhost:3000/proxy/get-user-order-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(idResponseJson.result)
        });

        const ordersData = await ordersRes.json();
        if (ordersData.error) {
          this.errorMessage = ordersData.error;
        } else {
          this.orders = ordersData.result.rows || ordersData.result.orders || [];
        }
      } catch (err) {
        console.error('Ошибка при загрузке заказов:', err);
        this.errorMessage = 'Ошибка подключения к серверу или получения данных заказов';
        this.orders = [];
      } finally {
        this.isLoading = false;
      }
    },
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
        this.sortDir = 'desc';
      }
      this.loadOrders();
    },
    toggleCreatedAtSort() {
      if (this.sortField === 'createdAt') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'createdAt';
        this.sortDir = 'desc';
      }
      this.loadOrders();
    },
    async viewOrderDetails(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/proxy/get-user-order-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({order: {id}})
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
          this.selectedOrder = null;
        } else if (data.result?.order) {
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
    closeModal() {
      this.selectedOrder = null;
    }
  }
};
</script>

<style scoped>
.orders-container {
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  grid-template-columns: 1.5fr 2fr 1.5fr 2fr;
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

.table-row:hover {
  background-color: #f0f4f8;
}

.cell {
  padding: 0.75rem 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.table-row .cell {
  white-space: nowrap;
}


.table-header .cell {
  align-items: flex-start;
  justify-content: flex-start;
}

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
  white-space: nowrap;
}

.cell > .sortable, .column-header.sortable {
  cursor: pointer;
  user-select: none;
}


.status-filter-checkboxes {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9rem;
}

.status-filter-checkboxes > div {
  display: flex;
  align-items: center;
}

.status-filter-checkboxes input[type="checkbox"] {
  margin-right: 5px;
  flex-shrink: 0;
}

.status-filter-checkboxes label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
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
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.filter-range input {
  width: 100%;
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
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
.info-group ul {
  margin: 0;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
  color: #1f2937;
  word-break: break-word;
  white-space: pre-wrap;
  list-style: none;
}

.info-group ul {
  padding-left: 0.8rem;
  white-space: normal;
}

.info-group ul li {
  margin-bottom: 0.4rem;
  padding-left: 1.2rem;
  position: relative;
}

.info-group ul li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #374151;
  font-weight: bold;
}

.empty-table-message {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1.1rem;
}

/* Цвета статусов */
.cell.status-active,
.modal .info-group p.status-active {
  color: #2E7D32; /* Темно-зеленый */
  font-weight: bold;
}

.cell.status-rejected,
.modal .info-group p.status-rejected {
  color: #D32F2F; /* Темно-красный */
  font-weight: bold;
}

.cell.status-closed,
.modal .info-group p.status-closed {
  color: #455A64; /* Темно-серый синий */
  font-weight: bold;
}

.cell.status-booked,
.modal .info-group p.status-booked {
  color: #F57F17; /* Темно-желтый/оранжевый */
  font-weight: bold;
}


@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1.5fr 1fr 1.5fr;
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
    flex-direction: column;
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
    padding-left: 1rem;
  }
}

</style>