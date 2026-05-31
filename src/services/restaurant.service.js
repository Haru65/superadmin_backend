import { env } from '../config/env.js'
import { createSourceClient } from './source-http.service.js'

const api = createSourceClient(env.RESTAURANT_API_URL, env.RESTAURANT_API_TOKEN)

export const restaurantService = {
  getTenants: () => api.get('/superadmin/restaurants'),
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
