import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import AboutView from '../views/AboutView.vue'
import UserDashboard from '../views/UserDashboard.vue'
import Profile from '../views/dashboard/ProfileView.vue'
import Books from '../views/dashboard/BooksView.vue'
import Orders from '../views/dashboard/OrdersView.vue'
import Vacancies from '../views/dashboard/VacanciesView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/about', component: AboutView },
  {
    path: '/dashboard',
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
