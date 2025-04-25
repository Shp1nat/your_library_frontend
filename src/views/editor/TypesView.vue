<template>
  <div class="editor-container">
    <div class="header-row">
      <button class="btn back-button" @click="goBack">⬅ Назад</button>
      <h1 class="title">Редактор типов</h1>
    </div>

    <div class="top-bar">
      <div class="button-group-right">
        <button class="btn add" @click="openNewTypeModal">Добавить тип</button>
        <button class="btn delete-selected" @click="deleteSelectedTypes" :disabled="!selectedIds.length">Удалить выбранные</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div class="cell checkbox-cell"></div>
        <div class="cell">Название <input v-model="searchName" @input="loadTypes" /></div>
        <div class="cell sortable" @click="toggleSort">Последнее изменение {{ sortDir === 'asc' ? '↑' : '↓' }}</div>
      </div>

      <div
          v-for="type in types"
          :key="type.id"
          class="table-row"
          @click="selectType(type.id)"
      >
        <div class="cell checkbox-cell" @click.stop>
          <input type="checkbox" :value="type.id" v-model="selectedIds" />
        </div>
        <div class="cell">{{ type.name }}</div>
        <div class="cell">{{ formatDate(type.updatedAt) }}</div>
      </div>
    </div>

    <div v-if="selectedType" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isCreatingNew ? 'Добавление типа' : 'Редактирование типа' }}</h2>
        <div class="form-group">
          <label>Название:</label>
          <input v-model="selectedType.name" />
        </div>
        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="selectedType.description"></textarea>
        </div>
        <div class="actions">
          <button @click="saveType" class="btn save">Сохранить</button>
          <button v-if="!isCreatingNew" @click="deleteType" class="btn delete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      types: [],
      selectedType: null,
      isCreatingNew: false,
      sortDir: 'asc',
      selectedIds: [],
      searchName: ''
    }
  },
  async mounted() {
    await this.loadTypes();
  },
  methods: {
    async loadTypes() {
      const token = localStorage.getItem('token');
      const conditions = [];

      if (this.searchName) {
        conditions.push({ var: 'name', operator: 'contain', value: this.searchName });
      }

      const response = await fetch('http://localhost:3000/proxy/get-type-ids.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conditions,
          main_cond: 'and',
          search: '',
          sort: 'updatedAt',
          sort_dir: this.sortDir
        })
      });

      const responseJson = await response.json();
      if (responseJson.result.rows.length > 0) {
        const typesRes = await fetch('http://localhost:3000/proxy/get-type-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(responseJson.result)
        });
        const typesData = await typesRes.json();
        this.types = typesData.result.rows;
      } else {
        this.types = [];
      }
    },
    toggleSort() {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      this.loadTypes();
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    async selectType(id) {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/proxy/get-type-ids-out.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: { id } })
      });
      const data = await res.json();
      this.selectedType = data.result.type;
      this.isCreatingNew = false;
    },
    openNewTypeModal() {
      this.selectedType = {
        name: '',
        description: ''
      };
      this.isCreatingNew = true;
    },
    closeModal() {
      this.selectedType = null;
      this.isCreatingNew = false;
    },
    async saveType() {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/proxy/set-type.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: this.selectedType })
      });
      await this.loadTypes();
      this.closeModal();
    },
    async deleteType() {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/proxy/remove-type.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: { id: this.selectedType.id } })
      });
      await this.loadTypes();
      this.closeModal();
    },
    async deleteSelectedTypes() {
      if (!this.selectedIds.length) return;
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/proxy/remove-type.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: { id: this.selectedIds } })
      });
      this.selectedIds = [];
      await this.loadTypes();
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

.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.button-group-right {
  display: flex;
  gap: 1rem;
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

.table-header, .table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
}

.table-header {
  background-color: #f9fafb;
  font-weight: bold;
  padding: 0.5rem;
}

.table-header .cell input {
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.25rem;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.table-row {
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f3f4f6;
}

.cell {
  padding: 0.5rem;
}

.checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sortable {
  cursor: pointer;
  user-select: none;
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

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
}

textarea {
  resize: none;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}
</style>
