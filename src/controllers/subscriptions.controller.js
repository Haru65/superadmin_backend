import { aggregatorService } from '../services/aggregator.service.js'
import { logAudit } from '../services/audit.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { normalizeSubscription } from '../utils/normalizeSubscription.js'
import { ApiError } from '../utils/ApiError.js'

export const listSubscriptions = async (req, res) => {
  const result = await aggregatorService.subscriptions(req.query)
  res.json({ success: true, data: result.data, meta: { total: result.data.length, sources: result.sources } })
}

export const updateSubscription = async (req, res) => {
  const { source, id } = req.params
  if (source !== 'restaurant') throw new ApiError(501, `${source} subscription update not implemented yet`)
  const tenants = await aggregatorService.tenants()
  const subscription = normalizeSubscription(await restaurantService.updateSubscription(id, req.body), source, tenants.data)
  await logAudit(req, { action: 'subscription.update', entityType: 'subscription', entityId: subscription.id, description: `Updated ${source} subscription` })
  res.json({ success: true, data: subscription })
}
