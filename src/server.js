import { app } from './app.js'
import { pool } from './config/db.js'
import { env } from './config/env.js'

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`[SERVER] superadmin-backend listening on http://${env.HOST}:${env.PORT}`)
})

const shutdown = (signal) => {
  console.log(`[SERVER] ${signal} received, shutting down`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
