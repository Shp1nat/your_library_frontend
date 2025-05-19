<template>
  <div class="vacancies-container">
    <div class="header-row">
      <h1 class="title">Мои отклики</h1>
      <button class="create-button" @click="openCreateModal">Создать отклик</button>
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
                  @change="loadVacancies"
              />
              <label :for="'status-' + englishName">{{ russianName }}</label>
            </div>
          </div>
        </div>
        <div class="cell date-column">
          <div class="column-header sortable" @click="toggleUpdatedAtSort">
            <span style="margin-right: 0.3rem;">Дата обновления</span>
            <span v-if="sortField === 'updatedAt'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          </div>
        </div>
        <div class="cell">
          Текст вакансии
        </div>
      </div>

      <div v-if="isLoading" class="empty-table-message">
        Загрузка вакансий...
      </div>

      <div v-if="!isLoading && !vacancies.length && !errorMessage" class="empty-table-message">
        Ваш список откликов выбранного типа пуст.
      </div>

      <div
          v-for="vacancy in vacancies"
          :key="vacancy.id"
          class="table-row"
          @click="viewVacancyDetails(vacancy.id)" >
        <div class="cell" :class="'status-' + vacancy.status">{{ getStatusDisplayName(vacancy.status) }}</div>
        <div class="cell">{{ formatDate(vacancy.updatedAt) }}</div>
        <div class="cell text-cell">{{ vacancy.text || 'Без текста' }}</div>
      </div>

    </div>

    <div v-if="selectedVacancy" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Детали отклика на вакансию №{{ selectedVacancy.id }}</h2>
        <div class="info-group">
          <label>Статус:</label>
          <p :class="'status-' + selectedVacancy.status">{{ getStatusDisplayName(selectedVacancy.status) || 'Не указан' }}</p>
        </div>
        <div class="info-group">
          <label>Дата обновления:</label>
          <p>{{ formatDate(selectedVacancy.updatedAt) || 'Не указана' }}</p>
        </div>
        <div class="info-group">
          <label>Текст вакансии:</label>
          <p>{{ selectedVacancy.text || 'Текст не указан' }}</p>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal">
        <h2>Создать новый отклик</h2>
        <div class="info-group">
          <label for="vacancyText">Текст отклика:</label>
          <textarea id="vacancyText" v-model="newVacancyText" rows="6" class="modal-textarea"></textarea>
        </div>
        <button @click="createVacancy" :disabled="isCreating" class="modal-button">
          {{ isCreating ? 'Создание...' : 'Создать' }}
        </button>
        <button @click="closeCreateModal" class="modal-button secondary">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserVacancies',
  data() {
    return {
      vacancies: [],
      selectedVacancy: null,
      showCreateModal: false,
      newVacancyText: '',
      sortDir: 'desc',
      sortField: 'updatedAt',
      statusMap: {
        'waiting': 'Ожидание',
        'rejected': 'Отклонено',
        'accepted': 'Принято',
      },
      selectedStatuses: {
        'waiting': true,
        'rejected': true,
        'accepted': true,
      },
      errorMessage: '',
      isLoading: false,
      isCreating: false,
    };
  },
  async mounted() {
    await this.loadVacancies();
  },
  methods: {
    getStatusDisplayName(status) {
      return this.statusMap[status] || status || 'Неизвестный статус';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const options = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
        return new Date(dateStr).toLocaleString(undefined, options);
      } catch (e) {
        return 'Некорректная дата';
      }
    },
    async loadVacancies() {
      this.errorMessage = '';
      this.isLoading = true;
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.vacancies = [];
        this.isLoading = false;
        return;
      }

      const conditions = [];
      const allStatuses = Object.keys(this.statusMap);
      const selectedStatusValues = Object.keys(this.selectedStatuses).filter(key => this.selectedStatuses[key]);

      let mainCond = 'and';

      if (selectedStatusValues.length > 0 && selectedStatusValues.length < allStatuses.length) {
        selectedStatusValues.forEach(status => {
          conditions.push({var: 'status', operator: 'contain', value: status});
        });
        mainCond = 'or';
      }

      try {
        const idResponse = await fetch('http://localhost:3000/proxy/get-user-vacancy-ids.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conditions,
            main_cond: mainCond,
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

        const vacanciesRes = await fetch('http://localhost:3000/proxy/get-user-vacancy-ids-out.json', {
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
        } else {
          this.vacancies = vacanciesData.result.rows || vacanciesData.result.vacancies || [];
        }
      } catch (err) {
        this.errorMessage = 'Ошибка подключения к серверу или получения данных вакансий';
        this.vacancies = [];
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
      this.loadVacancies();
    },
    toggleUpdatedAtSort() {
      if (this.sortField === 'updatedAt') {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = 'updatedAt';
        this.sortDir = 'desc';
      }
      this.loadVacancies();
    },
    async viewVacancyDetails(id) {
      this.errorMessage = '';
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/proxy/get-user-vacancy-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({vacancy: {id}})
        });

        const data = await res.json();
        if (data.error) {
          this.errorMessage = data.error;
          this.selectedVacancy = null;
        } else if (data.result?.vacancy) {
          this.selectedVacancy = data.result.vacancy;
        } else {
          this.errorMessage = 'Детали отклика на вакансию не найдены.';
          this.selectedVacancy = null;
        }
      } catch (err) {
        this.errorMessage = 'Ошибка подключения к серверу при получении деталей вакансии';
        this.selectedVacancy = null;
      }
    },
    closeModal() {
      this.selectedVacancy = null;
    },
    openCreateModal() {
      this.showCreateModal = true;
      this.newVacancyText = '';
      this.errorMessage = '';
    },
    closeCreateModal() {
      this.showCreateModal = false;
      this.newVacancyText = '';
    },
    async createVacancy() {
      this.errorMessage = '';
      this.isCreating = true;
      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Пользователь не авторизован.';
        this.isCreating = false;
        return;
      }
      if (!this.newVacancyText.trim()) {
        this.errorMessage = 'Текст вакансии не может быть пустым.';
        this.isCreating = false;
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/proxy/make-vacancy.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({vacancy: {text: this.newVacancyText}})
        });
        const data = await res.json();

        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.closeCreateModal();
          await this.loadVacancies();
        }
      } catch (err) {
        this.errorMessage = 'Ошибка подключения к серверу при создании вакансии';
      } finally {
        this.isCreating = false;
      }
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.header-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.header-row .title {
  grid-column: 2;
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.header-row .create-button {
  grid-column: 3;
  justify-self: end;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-button:hover {
  background-color: #2563eb;
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
  grid-template-columns: 1.5fr 2fr 3fr;
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


.status-filter-checkboxes {
  margin-top: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
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

.modal-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;
  font-family: sans-serif;
  color: #1f2937;
  background-color: #f9fafb;
}

.modal-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  margin-top: 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-right: 0.5rem;
}

.modal-button:hover {
  background-color: #2563eb;
}

.modal-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.modal-button.secondary {
  background-color: #6b7280;
}

.modal-button.secondary:hover {
  background-color: #4b5563;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .header-row .title {
    grid-column: unset;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .header-row .create-button {
    grid-column: unset;
    justify-self: unset;
    width: 100%;
    text-align: center;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 1.5fr 2fr;
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

  .modal-button {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}

</style>