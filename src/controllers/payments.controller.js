import { cafeService } from '../services/cafe.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { aggregatorService } from '../services/aggregator.service.js'
import { logAudit } from '../services/audit.service.js'
import { sourceError } from '../services/source-http.service.js'
import { ApiError } from '../utils/ApiError.js'
import { normalizePaymentConfig } from '../utils/normalizePaymentConfig.js'
import { redactSecrets } from '../utils/redactSecrets.js'

const paymentServices = {
  cafe: cafeService,
  restaurant: restaurantService,
}
const placeholder = (source, tenantId) => normalizePaymentConfig({}, source, { id: `${source}:${tenantId}` })
const findTenant = async (source, tenantId) => (await aggregatorService.tenants()).data.find((tenant) => tenant.source === source && tenant.sourceId === tenantId) ?? { id: `${source}:${tenantId}` }
const inferProvider = (body = {}) => {
  const provider = String(body.provider || '').toLowerCase()
  if (['paytm', 'razorpay'].includes(provider)) return provider
  const keyId = String(body.keyId ?? body.key_id ?? '')
  return keyId.startsWith('rzp_') ? 'razorpay' : 'paytm'
}
const paymentPayload = (body = {}) => {
  const provider = inferProvider(body)
  const keyId = body.keyId ?? body.key_id
  const keySecret = body.keySecret ?? body.key_secret
  const webhookSecret = body.webhookSecret ?? body.webhook_secret
  const accountLabel = body.accountLabel ?? body.account_label
  const isActive = body.isActive ?? body.is_active
  const isDefault = body.isDefault ?? body.is_default
  return {
    ...body,
    provider,
    accountId: body.accountId ?? body.id,
    accountLabel,
    account_label: accountLabel,
    keyId,
    key_id: keyId,
    keySecret,
    key_secret: keySecret,
    webhookSecret,
    webhook_secret: webhookSecret,
    website: body.website || 'WEBSTAGING',
    isActive,
    is_active: isActive,
    isDefault,
    is_default: isDefault,
  }
}
const rethrowSourceClientError = (error) => {
  const status = error.response?.status
  if (status >= 400 && status < 500) throw new ApiError(status, sourceError(error))
  throw error
}

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
  let payment
  try {
    payment = normalizePaymentConfig(await service.savePaymentConfig(tenantId, paymentPayload(req.body)), source, tenant)
  } catch (error) {
    rethrowSourceClientError(error)
  }
  await logAudit(req, { action: 'payment_config.save', entityType: 'payment_config', entityId: `${source}:${tenantId}`, description: 'Saved payment gateway configuration' })
  res.json({ success: true, data: payment })
}

export const validatePaymentConfig = async (req, res) => {
  const { source, tenantId } = req.params
  const service = paymentServices[source]
  if (!service?.validatePaymentConfig) return res.json({ success: true, data: { message: `${source} payment validation not implemented yet`, source, isValid: false } })
  let result
  try {
    result = await service.validatePaymentConfig(tenantId, paymentPayload(req.body))
  } catch (error) {
    rethrowSourceClientError(error)
  }
  await logAudit(req, { action: 'payment_config.validate', entityType: 'payment_config', entityId: `${source}:${tenantId}`, description: 'Validated payment gateway credential format' })
  res.json({ success: true, data: redactSecrets(result) })
}
