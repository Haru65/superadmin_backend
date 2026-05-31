import { Router } from 'express'
import { z } from 'zod'
import { listOrders } from '../controllers/orders.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const query = z.object({
  type: z.enum(['cafe', 'restaurant', 'lodging']).optional(),
  paymentStatus: z.enum(['paid', 'unpaid', 'pending', 'failed']).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
})

router.get('/orders', validateRequest(query, 'query'), asyncHandler(listOrders))

export default router
