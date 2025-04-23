<template>
  <div class="editor-container">
    <h1 class="title">Авторы</h1>

    <div class="authors-list">
      <div
          v-for="author in authors"
          :key="author.id"
          class="author-card"
          @click="selectAuthor(author.id)"
      >
        <h2>{{ author.lastname }} {{ author.name }} {{ author.patronymic }}</h2>
        <p>Последнее изменение: {{ formatDate(author.updatedAt) }}</p>
      </div>
    </div>

    <div v-if="selectedAuthor" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>Редактирование автора</h2>
        <div class="form-group">
          <label>Имя:</label>
          <input v-model="selectedAuthor.name" />
        </div>
        <div class="form-group">
          <label>Фамилия:</label>
          <input v-model="selectedAuthor.lastname" />
        </div>
        <div class="form-group">
          <label>Отчество:</label>
          <input v-model="selectedAuthor.patronymic" />
        </div>
        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="selectedAuthor.description"></textarea>
        </div>
        <div class="actions">
          <button @click="saveAuthor" class="btn save">Сохранить</button>
          <button @click="deleteAuthor" class="btn delete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      authors: [],
      selectedAuthor: null
    }
  },
  async mounted() {
    await this.loadAuthors()
  },
  methods: {
    async loadAuthors() {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/proxy/get-author-ids.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conditions: [],
          main_cond: 'and',
          search: '',
          sort_dir: 'asc'
        })
      })
      const responseJson = await response.json()

      if (responseJson.result.rows.length > 0) {
        const authorsRes = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(responseJson.result)
        })
        const authorsData = await authorsRes.json()
        this.authors = authorsData.result.rows
      } else {
        this.authors = []
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString()
    },
    async selectAuthor(id) {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/proxy/get-author-ids-out.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ author: { id } })
      })
      const data = await res.json()
      this.selectedAuthor = data.result.author
    },
    closeModal() {
      this.selectedAuthor = null
    },
    async saveAuthor() {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/proxy/set-author.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ author: this.selectedAuthor })
      })
      await this.loadAuthors()
      this.closeModal()
    },
    async deleteAuthor() {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/proxy/remove-author.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ author: { id: this.selectedAuthor.id } })
      })
      await this.loadAuthors()
      this.closeModal()
    }
  }
}
</script>

<style scoped>
.editor-container {
  padding: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.authors-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.author-card {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.author-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
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

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn.save {
  background-color: #2563eb;
  color: white;
}

.btn.delete {
  background-color: #ef4444;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}
</style>
