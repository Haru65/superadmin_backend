import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { query } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || ''
  if (!authorization.startsWith('Bearer ')) throw new ApiError(401, 'Authorization token is required')
  let payload
  try {
    payload = jwt.verify(authorization.slice(7), env.JWT_SECRET)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }
  const result = await query('SELECT id, name, email, role, is_active FROM superadmin_users WHERE id=$1', [payload.sub])
  const user = result.rows[0]
  if (!user || !user.is_active) throw new ApiError(401, 'Superadmin account is inactive or unavailable')
  req.user = user
  next()
})
