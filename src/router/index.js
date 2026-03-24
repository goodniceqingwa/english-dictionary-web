import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/study',
    name: 'Study',
    component: () => import('@/views/Study.vue'),
    meta: { title: '学习' }
  },
  {
    path: '/study/quiz',
    name: 'StudyQuiz',
    component: () => import('@/views/StudyQuiz.vue'),
    meta: { title: '学习测试' }
  },
  {
    path: '/study/computer',
    name: 'ComputerStudy',
    component: () => import('@/views/ComputerStudy.vue'),
    meta: { title: '计算机英语学习' }
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('@/views/Review.vue'),
    meta: { title: '复习', requiresAuth: true }
  },
  {
    path: '/collection',
    name: 'Collection',
    component: () => import('@/views/Collection.vue'),
    meta: { title: '收藏', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '个人设置', requiresAuth: true }
  },
  {
    path: '/word/:word',
    name: 'WordDetail',
    component: () => import('@/views/WordDetail.vue'),
    meta: { title: '单词详情' }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: { title: '登录/注册' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 英汉词典` : '英汉词典'

  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ name: 'Auth', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
