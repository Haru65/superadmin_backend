import { aggregatorService } from '../services/aggregator.service.js'

export const listOrders = async (req, res) => {
  const result = await aggregatorService.orders(req.query)
  res.json({ success: true, data: result.data, meta: { total: result.data.length, sources: result.sources } })
}
