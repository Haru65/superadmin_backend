import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { query } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })

export const authService = {
  async login(email, password) {
    const result = await query('SELECT * FROM superadmin_users WHERE LOWER(email)=LOWER($1)', [email])
    const user = result.rows[0]
    if (!user || !user.is_active || !await bcrypt.compare(password, user.password_hash)) throw new ApiError(401, 'Invalid email or password')
    await query('UPDATE superadmin_users SET last_login_at=NOW(), updated_at=NOW() WHERE id=$1', [user.id])
    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
    return { token, user: publicUser(user) }
  },
  publicUser,
}
