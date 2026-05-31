import { authService } from '../services/auth.service.js'
import { logAudit } from '../services/audit.service.js'

export const login = async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password)
  req.user = result.user
  await logAudit(req, { action: 'auth.login', entityType: 'superadmin_user', entityId: result.user.id, description: 'Superadmin login succeeded' })
  res.json({ success: true, data: result })
}

export const me = async (req, res) => res.json({ success: true, data: { user: authService.publicUser(req.user) } })
