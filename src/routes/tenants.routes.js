import { Router } from 'express'
import { z } from 'zod'
import { createTenant, deleteTenant, getTenant, listTenants, setTenantStatus, updateTenant } from '../controllers/tenants.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const source = z.enum(['cafe', 'restaurant', 'lodging'])
const sourceParams = z.object({ source, id: z.string().min(1) })
const query = z.object({
  type: source.optional(),
  status: z.enum(['active', 'paused', 'inactive', 'suspended']).optional(),
  search: z.string().trim().optional(),
})
const tenantBody = z.object({ source: source.optional() }).passthrough()
const statusBody = z.object({ status: z.enum(['active', 'paused']) })

router.get('/tenants', validateRequest(query, 'query'), asyncHandler(listTenants))
router.get('/tenants/:source/:id', validateRequest(sourceParams, 'params'), asyncHandler(getTenant))
router.post('/tenants', validateRequest(tenantBody), asyncHandler(createTenant))
router.put('/tenants/:source/:id', validateRequest(sourceParams, 'params'), validateRequest(tenantBody), asyncHandler(updateTenant))
router.patch('/tenants/:source/:id/status', validateRequest(sourceParams, 'params'), validateRequest(statusBody), asyncHandler(setTenantStatus))
router.delete('/tenants/:source/:id', validateRequest(sourceParams, 'params'), asyncHandler(deleteTenant))

export default router
