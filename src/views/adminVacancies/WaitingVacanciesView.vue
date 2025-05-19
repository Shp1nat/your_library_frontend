<template>
  <div class="vacancies-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Активные отклики</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button
            class="btn approve-selected"
            @click="approveSelectedVacancies"
            :disabled="!selectedIds.length"
        >Принять отклики</button>
        <button
            class="btn reject-selected"
            @click="rejectSelectedVacancies"
            :disabled="!selectedIds.length"
        >Отклонить отклики</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        </div>
        <div class="cell sortable" @click="toggleSort('id')">
          ID Вакансии
          <span v-if="sortField === 'id'" style="margin-left: 0.3rem;">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
        </div>
        <div class="cell date-column">
          <div class="column-header sortable" @click="toggleSort('updatedAt')">
            <span style="margin-right: 0.3rem;">Дата создания</span>
            <span v-if="sortField === 'updatedAt'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
        </div>
        <div class="cell text-column">
          <div class="column-header">Текст вакансии</div>
          <input v-model="textSearch" @input="loadWaitingVacancies" placeholder="Поиск по тексту..." class="header-filter-input"/>
        </div>
      </div>

      <div v-if="isLoading" class="empty-table-message">
        Загрузка вакансий...
      </div>

      <div v-if="!isLoading && !vacancies.length && !errorMessage" class="empty-table-message">
        Список активных откликов пуст.
      </div>


      <div
          v-for="vacancy in vacancies"
          :key="vacancy.id"
          class="table-row"
          @click="openVacancyModal(vacancy)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="vacancy.id" v-model="selectedIds" />
        </div>
        <div class="cell">{{ vacancy.id }}</div>
        <div class="cell">{{ formatDate(vacancy.updatedAt) }}</div>
        <div class="cell text-cell">{{ vacancy.text || 'Без текста' }}</div>
      </div>
    </div>

    <div v-if="selectedVacancy" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Детали отклика на вакансию #{{ selectedVacancy.id }}</h2>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="vacancy-details-section">
          <h3>Информация о пользователе</h3>
          <p><strong>ID:</strong> {{ selectedVacancy.user?.id }}</p>
          <p><strong>Логин:</strong> {{ selectedVacancy.user?.login }}</p>
          <p><strong>ФИО:</strong> {{ selectedVacancy.user ? `${selectedVacancy.user.lastname || ''} ${selectedVacancy.user.name || ''} ${selectedVacancy.user.patronymic || ''}`.trim() || 'Неизвестно' : 'Неизвестно' }}</p>
          <p><strong>Возраст:</strong> {{ selectedVacancy.user?.age }}</p>
          <p><strong>Штрафные баллы:</strong> {{ selectedVacancy.user?.penaltyPoints }}</p>
        </div>

        <div class="vacancy-details-section">
          <h3>Информация об отклике</h3>
          <p><strong>ID:</strong> {{ selectedVacancy.id }}</p>
          <p><strong>Статус:</strong> {{ getStatusDisplayName(selectedVacancy.status) || 'Не указан' }}</p>
          <p><strong>Дата создания:</strong> {{ formatDate(selectedVacancy.updatedAt) || 'Не указана' }}</p>
        </div>

        <div class="vacancy-details-section">
          <h3>Текст вакансии</h3>
          <p>{{ selectedVacancy.text || 'Текст не указан' }}</p>
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
      vacancies: [],
      selectedIds: [],
      selectedVacancy: null,
      errorMessage: '',
      sortField: 'updatedAt',
      sortDir: 'desc',
      textSearch: '',
      statusMap: {
        'waiting': 'Ожидание',
        'accepted': 'Принято',
        'rejected': 'Отклонено',
      },
      isLoading: false,
    };
  },
  computed: {
    allSelected() {
      return this.vacancies.length > 0 && this.selectedIds.length === this.vacancies.length;
    }
  },
  async mounted() {
    await this.loadWaitingVacancies();
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
        return 'Некорректная дата';
      }
    },
    async loadWaitingVacancies() {
      this.errorMessage = '';
      this.isLoading = true;
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.vacancies = [];
        this.isLoading = false;
        return;
      }

      const conditions = [{ var: 'status', operator: 'contain', value: 'waiting' }];

      if (this.textSearch) {
        conditions.push({ var: 'text', operator: 'contain', value: this.textSearch });
      }

      try {
        const idResponse = await fetch('http://localhost:3000/proxy/get-vacancy-ids.json', {
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

        const idResponseJson = await idResponse.json();

        if (idResponseJson.error) {
          this.errorMessage = idResponseJson.error;
          this.vacancies = [];
          return;
        }

        if (!idResponseJson.result?.rows?.length) {
          this.vacancies = [];
          return;
        }

        const vacanciesRes = await fetch('http://localhost:3000/proxy/get-vacancy-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(idResponseJson.result)
        });

        const vacanciesData = await vacanciesRes.json();

        if (vacanciesData.error) {
          this.errorMessage = vacanciesData.error;
          this.vacancies = [];
        } else {
          this.vacancies = vacanciesData.result.rows || vacanciesData.result.vacancies || [];
        }
      } catch (err) {
        this.errorMessage = 'Ошибка подключения к серверу';
        this.vacancies = [];
      } finally {
        this.isLoading = false;
      }
    },
    toggleSort(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDir = 'asc';
      }
      this.loadWaitingVacancies();
    },
    openVacancyModal(vacancy) {
      this.selectedVacancy = vacancy;
    },
    closeModal() {
      this.selectedVacancy = null;
      this.errorMessage = '';
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.vacancies.map(vacancy => vacancy.id);
      } else {
        this.selectedIds = [];
      }
    },
    async approveSelectedVacancies() {
      if (!this.selectedIds.length) return;
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/proxy/accept-vacancy.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({vacancyIds: this.selectedIds})
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          this.selectedIds = [];
          await this.loadWaitingVacancies();
        }
      } catch (err) {
        this.errorMessage = 'Ошибка подключения к серверу при принятии откликов';
      }
    },
    async rejectSelectedVacancies() {
      if (!this.selectedIds.length) return;
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }


      try {
        const response = await fetch('http://localhost:3000/proxy/reject-vacancy.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({vacancyIds: this.selectedIds})
        });

        const responseJson = await response.json();

        if (responseJson.error) {
          this.errorMessage = responseJson.error;
        } else {
          this.selectedIds = [];
          await this.loadWaitingVacancies();
        }
      } catch (err) {
        this.errorMessage = 'Ошибка подключения к серверу при отклонении откликов';
      }
    },
    goBack() {
      this.$router.push('/vacancies');
    }
  }
};
</script>

<style scoped>
.vacancies-container {
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
  transform: scale(1.03);
}

.btn.approve-selected:hover {
  background-color: #10b981;
  color: white;
}

.btn.reject-selected:hover {
  background-color: #ef4444;
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
  padding: 0.5rem 1rem;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 2fr 3fr;
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

.table-row .text-cell {
  white-space: normal;
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
  max-height: 90vh;
  overflow-y: auto;
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

.vacancy-details-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.vacancy-details-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.vacancy-details-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.vacancy-details-section p {
  margin-bottom: 0.5rem;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
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

.cell.status-waiting,
.modal .info-group p.status-waiting {
  color: #F57F17;
  font-weight: bold;
}

.cell.status-rejected,
.modal .info-group p.status-rejected {
  color: #D32F2F;
  font-weight: bold;
}

.cell.status-accepted,
.modal .info-group p.status-accepted {
  color: #2E7D32;
  font-weight: bold;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .title {
    position: static;
    transform: none;
    width: 100%;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .btn.back-button {
    align-self: flex-start;
  }

  .top-bar {
    justify-content: center;
  }

  .button-group-right {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .button-group-right .btn {
    width: 100%;
    text-align: center;
  }

  .table-header,
  .table-row {
    grid-template-columns: 40px 1fr 1.5fr 2fr;
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

  .modal {
    padding: 1.5rem;
  }

  .modal h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .vacancy-details-section {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
  }

  .vacancy-details-section h3 {
    font-size: 1rem;
  }

  .vacancy-details-section p {
    font-size: 0.9rem;
  }

  .actions {
    justify-content: center;
  }

  .actions .btn {
    width: 100%;
  }
}

</style>