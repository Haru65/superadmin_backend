import { Router } from 'express'
import { z } from 'zod'
import { getPaymentConfig, savePaymentConfig, validatePaymentConfig } from '../controllers/payments.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const params = z.object({
  source: z.enum(['cafe', 'restaurant', 'lodging']),
  tenantId: z.string().min(1),
})
const paymentBody = z.object({
  provider: z.enum(['paytm', 'razorpay', 'upi', 'none']).optional(),
  accountId: z.string().optional(),
  accountLabel: z.string().optional(),
  keyId: z.string().optional(),
  keySecret: z.string().optional(),
  webhookSecret: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
}).passthrough()

router.get('/tenants/:source/:tenantId/payment-config', validateRequest(params, 'params'), asyncHandler(getPaymentConfig))
router.post('/tenants/:source/:tenantId/payment-config', validateRequest(params, 'params'), validateRequest(paymentBody), asyncHandler(savePaymentConfig))
router.post('/tenants/:source/:tenantId/payment-config/validate', validateRequest(params, 'params'), validateRequest(paymentBody), asyncHandler(validatePaymentConfig))

export default router
