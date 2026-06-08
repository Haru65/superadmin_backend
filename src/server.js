import { app } from './app.js'
import { pool } from './config/db.js'
import { env } from './config/env.js'

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`[SERVER] superadmin-backend listening on http://${env.HOST}:${env.PORT}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${env.PORT} is already in use. Stop the existing process or change PORT.`)
  } else if (error.code === 'EACCES') {
    console.error(`[SERVER] Permission denied binding to ${env.HOST}:${env.PORT}.`)
  } else {
    console.error('[SERVER] Failed to start:', error)
  }
  process.exit(1)
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
