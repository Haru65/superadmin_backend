import { cafeService } from './cafe.service.js'
import { lodgingService } from './lodging.service.js'
import { restaurantService } from './restaurant.service.js'
import { sourceError } from './source-http.service.js'
import { env } from '../config/env.js'
import { normalizeOrder } from '../utils/normalizeOrder.js'
import { normalizeSubscription } from '../utils/normalizeSubscription.js'
import { normalizeTenant } from '../utils/normalizeTenant.js'
import { normalizeUser } from '../utils/normalizeUser.js'

const sources = ['cafe', 'restaurant', 'lodging']
const rows = (payload) => {
  if (Array.isArray(payload)) return payload
  return ['data', 'tenants', 'restaurants', 'hotels', 'users', 'orders', 'subscriptions', 'bookings']
    .map((key) => payload?.[key])
    .find(Array.isArray) ?? []
}
const sourceMeta = () => Object.fromEntries(sources.map((source) => [source, { success: true, error: null }]))
const mergeSources = (...items) => Object.fromEntries(sources.map((source) => {
  const failed = items.map((item) => item?.[source]).find((item) => item && !item.success)
  return [source, failed ?? { success: true, error: null }]
}))
const captureRows = async (source, request, normalize) => rows(await request()).map((row) => normalize(row, source))
const capture = async (source, request, meta, normalize) => {
  try {
    return captureRows(source, request, normalize)
  } catch (error) {
    meta[source] = { success: false, error: sourceError(error) }
    return []
  }
}
const filterText = (items, search, keys) => !search ? items : items.filter((item) => keys.some((key) => String(item[key] ?? '').toLowerCase().includes(String(search).toLowerCase())))
const filterType = (items, type) => type ? items.filter((item) => item.type === type || item.tenantType === type) : items
const monthKey = (value) => String(value || '').slice(0, 7)
const monthLabel = (period) => period ? new Date(`${period}-01T00:00:00Z`).toLocaleString('en-IN', { month: 'short' }) : ''
const breakdown = (values, key = 'type') => [...new Set(values)].map((value) => ({ [key]: value, count: values.filter((item) => item === value).length }))

export const aggregatorService = {
  async tenants(filters = {}) {
    console.log('[TENANTS] /superadmin/tenants called')
    console.log(`[TENANTS] CAFE_API_URL=${env.CAFE_API_URL}`)
    console.log(`[TENANTS] RESTAURANT_API_URL=${env.RESTAURANT_API_URL}`)
    const meta = sourceMeta()
    const sourceRequests = [
      ['cafe', cafeService.getTenants],
      ['restaurant', restaurantService.getTenants],
      ['lodging', lodgingService.getTenants],
    ]
    const settled = await Promise.allSettled(
      sourceRequests.map(([source, request]) => captureRows(source, request, normalizeTenant))
    )
    const data = settled.flatMap((result, index) => {
      const [source] = sourceRequests[index]
      if (result.status === 'fulfilled') return result.value
      const error = sourceError(result.reason)
      meta[source] = { success: false, error }
      console.error(`[TENANTS] ${source} source failed: ${error}`)
      return []
    })
    return {
      data: filterText(filterType(data, filters.type), filters.search, ['name', 'slug', 'ownerEmail', 'phone'])
        .filter((tenant) => !filters.status || tenant.status === filters.status),
      sources: meta,
    }
  },

  async users(filters = {}, tenantsResult) {
    const knownTenants = tenantsResult ?? await this.tenants()
    const meta = sourceMeta()
    const data = (await Promise.all([
      Promise.resolve([]),
      capture('restaurant', restaurantService.getUsers, meta, (row, source) => normalizeUser(row, source, knownTenants.data)),
      capture('lodging', lodgingService.getUsers, meta, (row, source) => normalizeUser(row, source, knownTenants.data)),
    ])).flat()
    return {
      data: filterText(filterType(data, filters.type), filters.search, ['name', 'email', 'tenantName'])
        .filter((user) => !filters.role || user.role === filters.role),
      sources: mergeSources(knownTenants.sources, meta),
    }
  },

  async orders(filters = {}, tenantsResult) {
    const knownTenants = tenantsResult ?? await this.tenants()
    const meta = sourceMeta()
    const data = (await Promise.all([
      Promise.resolve([]),
      capture('restaurant', restaurantService.getOrders, meta, (row, source) => normalizeOrder(row, source, knownTenants.data)),
      capture('lodging', lodgingService.getOrders, meta, (row, source) => normalizeOrder(row, source, knownTenants.data)),
    ])).flat()
    return {
      data: filterType(data, filters.type)
        .filter((order) => !filters.paymentStatus || order.paymentStatus === filters.paymentStatus)
        .filter((order) => !filters.from || order.createdAt >= filters.from)
        .filter((order) => !filters.to || order.createdAt.slice(0, 10) <= filters.to),
      sources: mergeSources(knownTenants.sources, meta),
    }
  },

  async subscriptions(filters = {}, tenantsResult) {
    const knownTenants = tenantsResult ?? await this.tenants()
    const meta = sourceMeta()
    const data = (await Promise.all([
      Promise.resolve([]),
      capture('restaurant', restaurantService.getSubscriptions, meta, (row, source) => normalizeSubscription(row, source, knownTenants.data)),
      capture('lodging', lodgingService.getSubscriptions, meta, (row, source) => normalizeSubscription(row, source, knownTenants.data)),
    ])).flat()
    return {
      data: filterType(data, filters.type).filter((subscription) => !filters.status || subscription.status === filters.status),
      sources: mergeSources(knownTenants.sources, meta),
    }
  },

  async dashboard() {
    const tenants = await this.tenants()
    const [users, orders, subscriptions] = await Promise.all([this.users({}, tenants), this.orders({}, tenants), this.subscriptions({}, tenants)])
    const totalRevenue = orders.data.reduce((sum, order) => sum + order.amount, 0)
    const paidRevenue = orders.data.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.amount, 0)
    const monthly = new Map()
    orders.data.forEach((order) => {
      const period = monthKey(order.createdAt)
      const point = monthly.get(period) ?? { period, month: monthLabel(period), revenue: 0, orders: 0 }
      point.revenue += order.amount
      point.orders += 1
      monthly.set(period, point)
    })
    const growth = new Map()
    tenants.data.filter((tenant) => tenant.createdAt).forEach((tenant) => {
      const period = monthKey(tenant.createdAt)
      const point = growth.get(period) ?? { period, month: monthLabel(period), count: 0 }
      point.count += 1
      growth.set(period, point)
    })
    return {
      totalTenants: tenants.data.length,
      activeTenants: tenants.data.filter((tenant) => tenant.status === 'active').length,
      totalUsers: users.data.length,
      totalOrders: orders.data.length,
      totalRevenue,
      paidRevenue,
      unpaidRevenue: totalRevenue - paidRevenue,
      averageOrderValue: orders.data.length ? Number((totalRevenue / orders.data.length).toFixed(2)) : 0,
      activeSubscriptions: subscriptions.data.filter((subscription) => subscription.status === 'active').length,
      monthlyRevenue: [...monthly.values()].sort((a, b) => a.period.localeCompare(b.period)).map(({ period, month, revenue }) => ({ period, month, revenue })),
      monthlyOrders: [...monthly.values()].sort((a, b) => a.period.localeCompare(b.period)).map(({ period, month, orders: count }) => ({ period, month, orders: count })),
      tenantGrowth: [...growth.values()].sort((a, b) => a.period.localeCompare(b.period)),
      orderTypeBreakdown: breakdown(orders.data.map((order) => order.orderType)),
      paymentMethodBreakdown: breakdown(orders.data.map((order) => order.paymentMethod), 'method'),
      businessTypeBreakdown: breakdown(tenants.data.map((tenant) => tenant.type)),
      sources: mergeSources(tenants.sources, users.sources, orders.sources, subscriptions.sources),
    }
  },
}
