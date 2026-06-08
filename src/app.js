import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { requireAuth } from './middleware/authMiddleware.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { ApiError } from './utils/ApiError.js'
import authRoutes from './routes/auth.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import debugRoutes from './routes/debug.routes.js'
import healthRoutes from './routes/health.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import revenueRoutes from './routes/revenue.routes.js'
import settingsRoutes from './routes/settings.routes.js'
import subscriptionsRoutes from './routes/subscriptions.routes.js'
import tenantsRoutes from './routes/tenants.routes.js'
import usersRoutes from './routes/users.routes.js'

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true)
    callback(new ApiError(403, 'Origin is not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use(healthRoutes)
// TODO: Remove this temporary diagnostics route after deployment verification.
app.use('/auth', authRoutes)
app.use('/debug', debugRoutes)
app.use('/superadmin', requireAuth, dashboardRoutes, tenantsRoutes, usersRoutes, ordersRoutes, revenueRoutes, subscriptionsRoutes, paymentsRoutes, settingsRoutes)

app.use(notFound)
app.use(errorHandler)
