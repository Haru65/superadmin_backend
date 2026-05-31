import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import bcrypt from 'bcrypt'
import { pool, query } from '../config/db.js'
import { env } from '../config/env.js'

const currentFile = fileURLToPath(import.meta.url)
const schemaPath = path.join(path.dirname(currentFile), 'schema.sql')

try {
  await query(await readFile(schemaPath, 'utf8'))
  const existing = await query('SELECT id FROM superadmin_users WHERE LOWER(email)=LOWER($1)', [env.SUPERADMIN_EMAIL])
  if (existing.rows[0]) {
    console.log(`[SEED] Superadmin already exists: ${env.SUPERADMIN_EMAIL}`)
  } else {
    const passwordHash = await bcrypt.hash(env.SUPERADMIN_PASSWORD, 12)
    await query(
      'INSERT INTO superadmin_users (name, email, password_hash) VALUES ($1,$2,$3)',
      [env.SUPERADMIN_NAME, env.SUPERADMIN_EMAIL.toLowerCase(), passwordHash],
    )
    console.log(`[SEED] Superadmin created: ${env.SUPERADMIN_EMAIL}`)
  }
} finally {
  await pool.end()
}
