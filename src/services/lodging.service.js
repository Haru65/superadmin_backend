import { env } from '../config/env.js'
import { createSourceClient } from './source-http.service.js'

const api = env.LODGING_API_URL ? createSourceClient(env.LODGING_API_URL, env.LODGING_API_TOKEN) : null
const empty = async (path) => {
  if (!api) return []
  return api.get(path)
}

export const lodgingService = {
  // TODO: Replace safe fallbacks as the lodging backend contract becomes available.
  getTenants: () => empty('/superadmin/hotels'),
  getUsers: () => empty('/superadmin/users'),
  getOrders: () => empty('/superadmin/bookings'),
  getRevenue: () => empty('/superadmin/revenue'),
  getSubscriptions: () => empty('/superadmin/subscriptions'),
}
