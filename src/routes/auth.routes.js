import { Router } from 'express'
import { z } from 'zod'
import { login, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', validateRequest(loginSchema), asyncHandler(login))
router.get('/me', requireAuth, asyncHandler(me))

export default router
