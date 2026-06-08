import { cafeService } from '../services/cafe.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { aggregatorService } from '../services/aggregator.service.js'
import { logAudit } from '../services/audit.service.js'
import { normalizePaymentConfig } from '../utils/normalizePaymentConfig.js'
import { redactSecrets } from '../utils/redactSecrets.js'

const paymentServices = {
  cafe: cafeService,
  restaurant: restaurantService,
}
const placeholder = (source, tenantId) => normalizePaymentConfig({}, source, { id: `${source}:${tenantId}` })
const findTenant = async (source, tenantId) => (await aggregatorService.tenants()).data.find((tenant) => tenant.source === source && tenant.sourceId === tenantId) ?? { id: `${source}:${tenantId}` }

export const getPaymentConfig = async (req, res) => {
  const { source, tenantId } = req.params
  const service = paymentServices[source]
  if (!service?.getPaymentConfig) return res.json({ success: true, data: placeholder(source, tenantId) })
  const tenant = await findTenant(source, tenantId)
  res.json({ success: true, data: normalizePaymentConfig(await service.getPaymentConfig(tenantId), source, tenant) })
}

export const savePaymentConfig = async (req, res) => {
  const { source, tenantId } = req.params
  const service = paymentServices[source]
  if (!service?.savePaymentConfig) return res.json({ success: true, data: { message: `${source} payment configuration not implemented yet`, source } })
  const tenant = await findTenant(source, tenantId)
  const payment = normalizePaymentConfig(await service.savePaymentConfig(tenantId, req.body), source, tenant)
  await logAudit(req, { action: 'payment_config.save', entityType: 'payment_config', entityId: `${source}:${tenantId}`, description: 'Saved payment gateway configuration' })
  res.json({ success: true, data: payment })
}

export const validatePaymentConfig = async (req, res) => {
  const { source, tenantId } = req.params
  const service = paymentServices[source]
  if (!service?.validatePaymentConfig) return res.json({ success: true, data: { message: `${source} payment validation not implemented yet`, source, isValid: false } })
  const result = await service.validatePaymentConfig(tenantId, req.body)
  await logAudit(req, { action: 'payment_config.validate', entityType: 'payment_config', entityId: `${source}:${tenantId}`, description: 'Validated payment gateway credential format' })
  res.json({ success: true, data: redactSecrets(result) })
}
