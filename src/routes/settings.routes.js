import { Router } from 'express'
import { z } from 'zod'
import { listSettings, upsertSetting } from '../controllers/settings.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const params = z.object({ key: z.string().trim().min(1).max(160) })
const body = z.object({ value: z.json() })

router.get('/settings', asyncHandler(listSettings))
router.put('/settings/:key', validateRequest(params, 'params'), validateRequest(body), asyncHandler(upsertSetting))

export default router
