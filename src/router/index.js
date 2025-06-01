import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ProfileLayout from '@/layouts/ProfileLayout.vue'
import BooksLayout from '@/layouts/BooksLayout.vue'
import OrdersLayout from '@/layouts/OrdersLayout.vue'
import VacanciesLayout from '@/layouts/VacanciesLayout.vue'
import EditorPage from '@/views/adminDashboard/EditorView.vue'
import OrderAdminPage from '@/views/adminDashboard/OrderView.vue'
import VacancyAdminPage from '@/views/adminDashboard/VacanciesView.vue'
import RecommendationsUserPage from '@/views/userDashboard/RecommendationsView.vue'

import AuthorsView from '@/views/editor/AuthorsView.vue'
import GenresView from '@/views/editor/GenresView.vue'
import TypesView from '@/views/editor/TypesView.vue'
import BooksEditorView from '@/views/editor/BooksView.vue'
import ExamplesView from '@/views/editor/ExamplesView.vue'
import PublishersView from '@/views/editor/PublishersView.vue'

import BookedOrdersView from '@/views/adminOrders/BookedOrdersView.vue'
import ActiveOrdersView from '@/views/adminOrders/ActiveOrdersView.vue'
import ClosedAndRejectedOrdersView from '@/views/adminOrders/ClosedAndRejectedOrdersView.vue'

import waitingVacanciesView from '@/views/adminVacancies/WaitingVacanciesView.vue'
import rejectedVacanciesView from '@/views/adminVacancies/RejectedVacanciesView.vue'
import acceptedVacanciesView from '@/views/adminVacancies/AcceptedVacanciesView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  {
    path: '/',
    component: DashboardLayout,
    children: [
      { path: '', redirect: 'profile' },
      { path: 'profile', component: ProfileLayout },
      { path: 'books', component: BooksLayout },
      { path: 'editor', component: EditorPage },
      { path: 'orders', component: OrdersLayout },
      { path: 'vacancies', component: VacanciesLayout },

      { path: 'editor/authors', component: AuthorsView },
      { path: 'editor/genres', component: GenresView },
      { path: 'editor/types', component: TypesView },
      { path: 'editor/books', component: BooksEditorView },
      { path: 'editor/examples', component: ExamplesView },
      { path: 'editor/publishers', component: PublishersView },

      { path: 'orders', component: OrderAdminPage },
      { path: 'orders/booked', component: BookedOrdersView },
      { path: 'orders/active', component: ActiveOrdersView },
      { path: 'orders/closed-rejected', component: ClosedAndRejectedOrdersView },

      { path: 'recommendations', component: RecommendationsUserPage },

      { path: 'vacancies', component: VacancyAdminPage },
      { path: 'vacancies/waiting', component: waitingVacanciesView },
      { path: 'vacancies/accepted', component: acceptedVacanciesView },
      { path: 'vacancies/rejected', component: rejectedVacanciesView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
