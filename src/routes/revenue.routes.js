import { Router } from 'express'
import { getAnalytics, getRevenue } from '../controllers/revenue.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/revenue', asyncHandler(getRevenue))
router.get('/analytics', asyncHandler(getAnalytics))

export default router
