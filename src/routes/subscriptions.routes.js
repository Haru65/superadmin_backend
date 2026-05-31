import { Router } from 'express'
import { z } from 'zod'
import { listSubscriptions, updateSubscription } from '../controllers/subscriptions.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const source = z.enum(['cafe', 'restaurant', 'lodging'])
const sourceParams = z.object({ source, id: z.string().min(1) })
const query = z.object({
  type: source.optional(),
  status: z.enum(['active', 'grace', 'suspended', 'inactive', 'expired']).optional(),
})
const updateBody = z.object({
  plan: z.enum(['Free', 'Standard', 'Premium', 'Enterprise']).optional(),
  status: z.enum(['active', 'grace', 'suspended', 'inactive', 'expired']).optional(),
  expiryDate: z.string().optional(),
  gracePeriodDays: z.coerce.number().int().nonnegative().optional(),
}).passthrough()

router.get('/subscriptions', validateRequest(query, 'query'), asyncHandler(listSubscriptions))
router.patch('/subscriptions/:source/:id', validateRequest(sourceParams, 'params'), validateRequest(updateBody), asyncHandler(updateSubscription))

export default router
