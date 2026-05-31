import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg
const useSsl = env.DATABASE_SSL || (env.NODE_ENV === 'production' && !env.DATABASE_URL.includes('127.0.0.1'))

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED } : false,
  max: 10,
  idleTimeoutMillis: 30000,
})

pool.on('error', (error) => console.error('[DB] Idle client error:', error.message))

export const query = (text, params = []) => pool.query(text, params)
