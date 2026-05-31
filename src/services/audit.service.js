import { query } from '../config/db.js'

export const logAudit = async (req, { action, entityType, entityId = null, description = null }) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.user?.id ?? null, action, entityType, entityId, description, req.ip, req.headers['user-agent'] ?? null],
    )
  } catch (error) {
    console.error('[AUDIT] Failed to persist audit event:', error.message)
  }
}
