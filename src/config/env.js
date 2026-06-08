import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { z } from 'zod'

const currentFile = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(currentFile), '../..')

dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true })

const boolean = z.string().optional().transform((value) => value === 'true')
const optionalUrl = z.string().url().optional().or(z.literal(''))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: boolean,
  DATABASE_SSL_REJECT_UNAUTHORIZED: boolean,
  JWT_SECRET: z.string().min(24, 'JWT_SECRET must be at least 24 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SUPERADMIN_EMAIL: z.string().email().default('admin@logdine.com'),
  SUPERADMIN_PASSWORD: z.string().min(12).default('ChangeThisPassword123'),
  SUPERADMIN_NAME: z.string().min(1).default('LogDine Admin'),
  CAFE_API_URL: z.string().url(),
  RESTAURANT_API_URL: z.string().url(),
  LODGING_API_URL: optionalUrl,
  CAFE_API_TOKEN: z.string().optional(),
  CAFE_API_EMAIL: z.string().email().optional().or(z.literal('')),
  CAFE_API_PASSWORD: z.string().optional(),
  RESTAURANT_API_TOKEN: z.string().optional(),
  RESTAURANT_API_EMAIL: z.string().email().optional().or(z.literal('')),
  RESTAURANT_API_PASSWORD: z.string().optional(),
  LODGING_API_TOKEN: z.string().optional(),
  LOGDINE_INTERNAL_API_TOKEN: z.string().optional(),
  PUBLIC_FRONTEND_URL: z.string().url(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  SOURCE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('[ENV] Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
}
