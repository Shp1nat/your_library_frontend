import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import UserDashboard from '../views/UserDashboard.vue'
import Profile from '@/views/userDashboard/ProfileView.vue'
import Books from '@/views/userDashboard/BooksView.vue'
import Orders from '@/views/userDashboard/OrdersView.vue'
import Vacancies from '@/views/userDashboard/VacanciesView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  {
    path: '/userDashboard',
    component: UserDashboard,
    children: [
      { path: '', redirect: 'profile' },
      { path: 'profile', component: Profile },
      { path: 'books', component: Books },
      { path: 'orders', component: Orders },
      { path: 'vacancies', component: Vacancies }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
