export const health = async (req, res) => res.json({ status: 'ok', service: 'superadmin-backend', timestamp: new Date().toISOString() })
