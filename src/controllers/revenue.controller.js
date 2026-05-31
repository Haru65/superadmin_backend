import { aggregatorService } from '../services/aggregator.service.js'

const buildRevenue = async () => {
  const orders = await aggregatorService.orders()
  const totalRevenue = orders.data.reduce((sum, order) => sum + order.amount, 0)
  const paidRevenue = orders.data.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.amount, 0)
  const byMethod = new Map()
  const byType = new Map()
  const monthly = new Map()
  orders.data.forEach((order) => {
    byMethod.set(order.paymentMethod, (byMethod.get(order.paymentMethod) || 0) + order.amount)
    byType.set(order.tenantType, (byType.get(order.tenantType) || 0) + order.amount)
    const period = order.createdAt.slice(0, 7)
    const point = monthly.get(period) ?? { period, revenue: 0, orders: 0 }
    point.revenue += order.amount
    point.orders += 1
    monthly.set(period, point)
  })
  return {
    totalRevenue,
    paidRevenue,
    unpaidRevenue: totalRevenue - paidRevenue,
    totalOrders: orders.data.length,
    averageOrderValue: orders.data.length ? Number((totalRevenue / orders.data.length).toFixed(2)) : 0,
    monthlyData: [...monthly.values()].sort((a, b) => a.period.localeCompare(b.period)),
    revenueByPaymentMethod: [...byMethod].map(([method, amount]) => ({ method, amount })),
    revenueByBusinessType: [...byType].map(([type, amount]) => ({ type, amount })),
    sources: orders.sources,
  }
}

export const getRevenue = async (req, res) => res.json({ success: true, data: await buildRevenue() })
export const getAnalytics = async (req, res) => res.json({ success: true, data: await aggregatorService.dashboard() })
