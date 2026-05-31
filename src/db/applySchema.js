import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool, query } from '../config/db.js'

const currentFile = fileURLToPath(import.meta.url)
const schemaPath = path.join(path.dirname(currentFile), 'schema.sql')

try {
  await query(await readFile(schemaPath, 'utf8'))
  console.log('[DB] SuperAdmin schema applied successfully')
} finally {
  await pool.end()
}
