import { env } from '../config/env.js'
import { createSourceClient } from './source-http.service.js'

const api = createSourceClient(env.CAFE_API_URL, {
  name: 'cafe',
  token: env.CAFE_API_TOKEN,
  internalToken: env.LOGDINE_INTERNAL_API_TOKEN,
  auth: {
    path: '/auth/login',
    email: env.CAFE_API_EMAIL,
    password: env.CAFE_API_PASSWORD,
    body: (email, password) => ({ email, password }),
  },
})

export const cafeService = {
  getTenants: () => api.get('/admin/superadmin/tenants'),
  health: () => api.probe('/admin/superadmin/tenants'),
  getTenant: (id) => api.get(`/admin/superadmin/tenants/${id}`),
  createTenant: (body) => api.post('/admin/superadmin/tenants', body),
  updateTenant: (id, body) => api.put(`/admin/superadmin/tenants/${id}`, body),
  deleteTenant: (id) => api.delete(`/admin/superadmin/tenants/${id}`),
  pauseTenant: (id) => api.patch(`/admin/superadmin/tenants/${id}/pause`),
  resumeTenant: (id) => api.patch(`/admin/superadmin/tenants/${id}/resume`),
  getMetrics: () => api.get('/admin/superadmin/dashboard/metrics'),
  getUsers: () => api.get('/superadmin/users'),
  createUser: (body) => api.post('/superadmin/users', { ...body, password: body.password ?? body.temporaryPassword }),
  updateUser: (id, body) => api.patch(`/superadmin/users/${id}`, body),
  resetPassword: (id, body) => api.post(`/superadmin/users/${id}/reset-password`, { password: body.password ?? body.temporaryPassword }),
  deleteUser: (id) => api.delete(`/superadmin/users/${id}`),
  getPaymentConfig: (tenantId) => api.get(`/admin/superadmin/tenants/${tenantId}/payment-config`),
  savePaymentConfig: (tenantId, body) => api.post(`/admin/superadmin/tenants/${tenantId}/payment-config`, body),
  validatePaymentConfig: (tenantId, body) => api.post(`/admin/superadmin/tenants/${tenantId}/payment-config/validate`, body),
}
