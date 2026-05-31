import { cafeService } from '../services/cafe.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { aggregatorService } from '../services/aggregator.service.js'
import { logAudit } from '../services/audit.service.js'
import { normalizeTenant } from '../utils/normalizeTenant.js'
import { ApiError } from '../utils/ApiError.js'

const placeholder = (source) => ({ message: `${source[0].toUpperCase()}${source.slice(1)} tenant status update not implemented yet`, source })

export const listTenants = async (req, res) => {
  const result = await aggregatorService.tenants(req.query)
  res.json({ success: true, data: result.data, meta: { total: result.data.length, sources: result.sources } })
}

export const getTenant = async (req, res) => {
  const { source, id } = req.params
  if (source === 'cafe') return res.json({ success: true, data: normalizeTenant(await cafeService.getTenant(id), source) })
  const result = await aggregatorService.tenants()
  const tenant = result.data.find((item) => item.source === source && item.sourceId === id)
  if (!tenant) throw new ApiError(404, 'Tenant not found')
  res.json({ success: true, data: tenant, meta: { sources: result.sources } })
}

export const createTenant = async (req, res) => {
  const source = req.body.source || 'cafe'
  if (source !== 'cafe') throw new ApiError(501, `${source} tenant creation not implemented yet`)
  const tenant = normalizeTenant(await cafeService.createTenant(req.body), source)
  await logAudit(req, { action: 'tenant.create', entityType: 'tenant', entityId: tenant.id, description: `Created ${source} tenant` })
  res.status(201).json({ success: true, data: tenant })
}

export const updateTenant = async (req, res) => {
  const { source, id } = req.params
  if (source !== 'cafe') throw new ApiError(501, `${source} tenant update not implemented yet`)
  const tenant = normalizeTenant(await cafeService.updateTenant(id, req.body), source)
  await logAudit(req, { action: 'tenant.update', entityType: 'tenant', entityId: tenant.id, description: `Updated ${source} tenant` })
  res.json({ success: true, data: tenant })
}

export const setTenantStatus = async (req, res) => {
  const { source, id } = req.params
  const { status } = req.body
  if (source !== 'cafe') return res.json({ success: true, data: placeholder(source) })
  const result = status === 'active' ? await cafeService.resumeTenant(id) : await cafeService.pauseTenant(id)
  await logAudit(req, { action: `tenant.${status}`, entityType: 'tenant', entityId: `${source}:${id}`, description: `Changed tenant status to ${status}` })
  res.json({ success: true, data: result })
}

export const deleteTenant = async (req, res) => {
  const { source, id } = req.params
  if (source === 'cafe') await cafeService.deleteTenant(id)
  else if (source === 'restaurant') await restaurantService.deleteTenant(id)
  else throw new ApiError(501, 'Lodging tenant deletion not implemented yet')
  await logAudit(req, { action: 'tenant.delete', entityType: 'tenant', entityId: `${source}:${id}`, description: `Deleted ${source} tenant` })
  res.json({ success: true, data: { id: `${source}:${id}`, deleted: true } })
}
