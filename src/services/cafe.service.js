import { env } from '../config/env.js'
import { createSourceClient } from './source-http.service.js'

const api = createSourceClient(env.CAFE_API_URL, env.CAFE_API_TOKEN)

export const cafeService = {
  getTenants: () => api.get('/admin/superadmin/tenants'),
  getTenant: (id) => api.get(`/admin/superadmin/tenants/${id}`),
  createTenant: (body) => api.post('/admin/superadmin/tenants', body),
  updateTenant: (id, body) => api.put(`/admin/superadmin/tenants/${id}`, body),
  deleteTenant: (id) => api.delete(`/admin/superadmin/tenants/${id}`),
  pauseTenant: (id) => api.patch(`/admin/superadmin/tenants/${id}/pause`),
  resumeTenant: (id) => api.patch(`/admin/superadmin/tenants/${id}/resume`),
  getMetrics: () => api.get('/admin/superadmin/dashboard/metrics'),
  getPaymentConfig: (tenantId) => api.get(`/admin/superadmin/tenants/${tenantId}/payment-config`),
  savePaymentConfig: (tenantId, body) => api.post(`/admin/superadmin/tenants/${tenantId}/payment-config`, body),
  validatePaymentConfig: (tenantId, body) => api.post(`/admin/superadmin/tenants/${tenantId}/payment-config/validate`, body),
}
