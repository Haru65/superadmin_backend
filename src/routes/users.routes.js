import { Router } from 'express'
import { z } from 'zod'
import { createUser, deleteUser, listUsers, resetPassword, updateUser } from '../controllers/users.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const source = z.enum(['cafe', 'restaurant', 'lodging'])
const role = z.enum(['superadmin', 'admin', 'manager', 'staff', 'receptionist', 'housekeeping'])
const sourceParams = z.object({ source, id: z.string().min(1) })
const query = z.object({
  type: source.optional(),
  role: role.optional(),
  search: z.string().trim().optional(),
})
const createBody = z.object({
  source: source.optional(),
  name: z.string().trim().min(1),
  email: z.string().email(),
  role,
}).passthrough()
const updateBody = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  role: role.optional(),
  status: z.enum(['active', 'inactive']).optional(),
}).passthrough()
const resetPasswordBody = z.object({ password: z.string().min(8) }).passthrough()

router.get('/users', validateRequest(query, 'query'), asyncHandler(listUsers))
router.post('/users', validateRequest(createBody), asyncHandler(createUser))
router.patch('/users/:source/:id', validateRequest(sourceParams, 'params'), validateRequest(updateBody), asyncHandler(updateUser))
router.delete('/users/:source/:id', validateRequest(sourceParams, 'params'), asyncHandler(deleteUser))
router.post('/users/:source/:id/reset-password', validateRequest(sourceParams, 'params'), validateRequest(resetPasswordBody), asyncHandler(resetPassword))

export default router
