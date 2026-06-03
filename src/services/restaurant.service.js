import { env } from '../config/env.js'
import { createSourceClient } from './source-http.service.js'

const api = createSourceClient(env.RESTAURANT_API_URL, {
  name: 'restaurant',
  token: env.RESTAURANT_API_TOKEN,
  internalToken: env.LOGDINE_INTERNAL_API_TOKEN,
  auth: {
    path: '/auth/login',
    email: env.RESTAURANT_API_EMAIL,
    password: env.RESTAURANT_API_PASSWORD,
    body: (email, password) => ({ email, password, role: 'superadmin' }),
  },
})

export const restaurantService = {
  getTenants: () => api.get('/superadmin/restaurants'),
  health: () => api.probe('/superadmin/restaurants'),
  deleteTenant: (id) => api.delete(`/superadmin/restaurants/${id}`),
  getOrders: () => api.get('/orders'),
  getAnalytics: () => api.get('/superadmin/analytics'),
  getUsers: () => api.get('/superadmin/users'),
  createUser: (body) => api.post('/superadmin/users', body),
  updateUser: (id, body) => api.patch(`/superadmin/users/${id}`, body),
  resetPassword: (id, body) => api.post(`/superadmin/users/${id}/reset-password`, { temporaryPassword: body.password ?? body.temporaryPassword }),
  deleteUser: (id) => api.delete(`/superadmin/users/${id}`),
  getSubscriptions: () => api.get('/superadmin/subscriptions'),
  updateSubscription: (id, body) => api.patch(`/superadmin/subscriptions/${id}`, body),
}
