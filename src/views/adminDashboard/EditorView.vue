<template>
  <div class="editor-container">
    <h1 class="editor-title">Панель редактирования</h1>
    <div class="editor-grid">
      <EditorCard label="Авторы" icon="🖋" />
      <EditorCard label="Жанры" icon="🎭" />
      <EditorCard label="Типы" icon="📚" />
      <EditorCard label="Книги" icon="📖" />
      <EditorCard label="Издательства" icon="🏢" />
      <EditorCard label="Экземпляры" icon="🔖" />
    </div>
  </div>
</template>

<script>
import EditorCard from './EditorCard.vue'

export default {
  components: {
    EditorCard
  }
}
</script>

<style scoped>
.editor-container {
  padding: 40px;
  background: #f9fafb;
  min-height: 100vh;
}

.editor-title {
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
  color: #1e3a8a;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}
</style>
