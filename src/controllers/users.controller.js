import { aggregatorService } from '../services/aggregator.service.js'
import { logAudit } from '../services/audit.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { normalizeUser } from '../utils/normalizeUser.js'
import { ApiError } from '../utils/ApiError.js'

export const listUsers = async (req, res) => {
  const result = await aggregatorService.users(req.query)
  res.json({ success: true, data: result.data, meta: { total: result.data.length, sources: result.sources } })
}

export const createUser = async (req, res) => {
  const source = req.body.source || 'restaurant'
  if (source !== 'restaurant') throw new ApiError(501, `${source} user creation not implemented yet`)
  const tenants = await aggregatorService.tenants()
  const user = normalizeUser(await restaurantService.createUser(req.body), source, tenants.data)
  await logAudit(req, { action: 'user.create', entityType: 'user', entityId: user.id, description: `Created ${source} user` })
  res.status(201).json({ success: true, data: user })
}

export const updateUser = async (req, res) => {
  const { source, id } = req.params
  if (source !== 'restaurant') throw new ApiError(501, `${source} user update not implemented yet`)
  const tenants = await aggregatorService.tenants()
  const user = normalizeUser(await restaurantService.updateUser(id, req.body), source, tenants.data)
  await logAudit(req, { action: 'user.update', entityType: 'user', entityId: user.id, description: `Updated ${source} user` })
  res.json({ success: true, data: user })
}

export const deleteUser = async (req, res) => {
  const { source, id } = req.params
  if (source !== 'restaurant') throw new ApiError(501, `${source} user deletion not implemented yet`)
  await restaurantService.deleteUser(id)
  await logAudit(req, { action: 'user.delete', entityType: 'user', entityId: `${source}:${id}`, description: `Deleted ${source} user` })
  res.json({ success: true, data: { id: `${source}:${id}`, deleted: true } })
}

export const resetPassword = async (req, res) => {
  const { source, id } = req.params
  if (source !== 'restaurant') throw new ApiError(501, `${source} password reset not implemented yet`)
  const result = await restaurantService.resetPassword(id, req.body)
  await logAudit(req, { action: 'user.reset_password', entityType: 'user', entityId: `${source}:${id}`, description: `Reset password for ${source} user` })
  res.json({ success: true, data: result })
}
