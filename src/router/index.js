import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ProfileLayout from '@/layouts/ProfileLayout.vue'
import BooksLayout from '@/layouts/BooksLayout.vue'
import OrdersLayout from '@/layouts/OrdersLayout.vue'
import VacanciesLayout from '@/layouts/VacanciesLayout.vue'
import EditorPage from '@/views/adminDashboard/EditorView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      { path: '', redirect: 'profile' },
      { path: 'profile', component: ProfileLayout, alias: '/profile' },
      { path: 'books', component: BooksLayout, alias: '/books' },
      { path: 'editor', component: EditorPage, alias: '/editor' },
      { path: 'orders', component: OrdersLayout, alias: '/orders' },
      { path: 'vacancies', component: VacanciesLayout, alias: '/vacancies' },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
