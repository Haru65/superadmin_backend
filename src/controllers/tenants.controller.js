import { cafeService } from '../services/cafe.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { aggregatorService } from '../services/aggregator.service.js'
import { logAudit } from '../services/audit.service.js'
import { getLogoDataUrl, parseLogoDataUrl, saveTenantLogo, withLogoAliases } from '../services/tenantLogo.service.js'
import { normalizeTenant } from '../utils/normalizeTenant.js'
import { ApiError } from '../utils/ApiError.js'

const tenantSources = {
  cafe: cafeService,
  restaurant: restaurantService,
}

export const listTenants = async (req, res) => {
  const result = await aggregatorService.tenants(req.validatedQuery)
  res.json({ success: true, data: result.data, meta: { total: result.data.length, sources: result.sources } })
}

export const getTenant = async (req, res) => {
  const { source, id } = req.params
  if (source === 'cafe') return res.json({ success: true, data: normalizeTenant(await cafeService.getTenant(id), source) })
  if (source === 'restaurant') return res.json({ success: true, data: normalizeTenant(await restaurantService.getTenant(id), source) })
  const result = await aggregatorService.tenants()
  const tenant = result.data.find((item) => item.source === source && item.sourceId === id)
  if (!tenant) throw new ApiError(404, 'Tenant not found')
  res.json({ success: true, data: tenant, meta: { sources: result.sources } })
}

export const createTenant = async (req, res) => {
  const source = req.body.source || 'cafe'
  const service = tenantSources[source]
  if (!service) throw new ApiError(501, `${source} tenant creation not implemented yet`)
  const logoDataUrl = getLogoDataUrl(req.body)
  parseLogoDataUrl(logoDataUrl)
  const tenant = normalizeTenant(await service.createTenant(withLogoAliases(req.body, logoDataUrl)), source)
  const logo = await saveTenantLogo({ tenant, logoDataUrl, userId: req.user?.id })
  await logAudit(req, { action: 'tenant.create', entityType: 'tenant', entityId: tenant.id, description: `Created ${source} tenant` })
  res.status(201).json({ success: true, data: tenant, meta: { logo } })
}

export const updateTenant = async (req, res) => {
  const { source, id } = req.params
  const service = tenantSources[source]
  if (!service) throw new ApiError(501, `${source} tenant update not implemented yet`)
  const tenant = normalizeTenant(await service.updateTenant(id, req.body), source)
  await logAudit(req, { action: 'tenant.update', entityType: 'tenant', entityId: tenant.id, description: `Updated ${source} tenant` })
  res.json({ success: true, data: tenant })
}

export const setTenantStatus = async (req, res) => {
  const { source, id } = req.params
  const { status } = req.body
  if (source === 'lodging') throw new ApiError(501, 'Lodging tenant status update not implemented yet')
  const result = source === 'cafe'
    ? status === 'active' ? await cafeService.resumeTenant(id) : await cafeService.pauseTenant(id)
    : await restaurantService.setTenantStatus(id, status)
  await logAudit(req, { action: `tenant.${status}`, entityType: 'tenant', entityId: `${source}:${id}`, description: `Changed tenant status to ${status}` })
  res.json({ success: true, data: normalizeTenant(result, source) })
}

export const deleteTenant = async (req, res) => {
  const { source, id } = req.params
  if (source === 'cafe') await cafeService.deleteTenant(id)
  else if (source === 'restaurant') await restaurantService.deleteTenant(id)
  else throw new ApiError(501, 'Lodging tenant deletion not implemented yet')
  await logAudit(req, { action: 'tenant.delete', entityType: 'tenant', entityId: `${source}:${id}`, description: `Deleted ${source} tenant` })
  res.json({ success: true, data: { id: `${source}:${id}`, deleted: true } })
}
