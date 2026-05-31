import { query } from '../config/db.js'
import { logAudit } from '../services/audit.service.js'

export const listSettings = async (req, res) => {
  const { rows } = await query('SELECT id, key, value, created_at AS "createdAt", updated_at AS "updatedAt" FROM system_settings ORDER BY key')
  res.json({ success: true, data: rows, meta: { total: rows.length } })
}

export const upsertSetting = async (req, res) => {
  const { rows } = await query(
    `INSERT INTO system_settings (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING id, key, value, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [req.params.key, JSON.stringify(req.body.value)],
  )
  await logAudit(req, { action: 'system_setting.update', entityType: 'system_setting', entityId: req.params.key, description: 'Updated system setting' })
  res.json({ success: true, data: rows[0] })
}
