import { env } from '../config/env.js'

export const notFound = (req, res) => res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` })

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.statusCode || 500
  if (status >= 500) console.error('[ERROR]', error.message)
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { error: error.details || error.stack } : {}),
  })
}
