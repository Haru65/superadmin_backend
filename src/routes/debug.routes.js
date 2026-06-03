import { Router } from 'express'
import { env } from '../config/env.js'
import { cafeService } from '../services/cafe.service.js'
import { lodgingService } from '../services/lodging.service.js'
import { restaurantService } from '../services/restaurant.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const healthResult = async (config) => {
  const result = await config.check()
  return {
    url: config.url,
    [config.endpointKey]: config.endpoint,
    reachable: result.reachable,
    statusCode: result.statusCode,
    error: result.error,
  }
}

router.get('/source-health', asyncHandler(async (req, res) => {
  const checks = [
    ['cafe', {
      url: env.CAFE_API_URL,
      endpointKey: 'tenantsEndpoint',
      endpoint: '/admin/superadmin/tenants',
      check: cafeService.health,
    }],
    ['restaurant', {
      url: env.RESTAURANT_API_URL,
      endpointKey: 'tenantsEndpoint',
      endpoint: '/superadmin/tenants',
      check: restaurantService.health,
    }],
  ]

  if (env.LODGING_API_URL) {
    checks.push(['lodging', {
      url: env.LODGING_API_URL,
      endpointKey: 'hotelsEndpoint',
      endpoint: '/superadmin/hotels',
      check: lodgingService.health,
    }])
  }

  const settled = await Promise.allSettled(checks.map(([, config]) => healthResult(config)))
  const services = {
    superadmin: {
      status: 'ok',
      port: env.PORT,
    },
  }

  settled.forEach((result, index) => {
    const [source, config] = checks[index]
    services[source] = result.status === 'fulfilled'
      ? result.value
      : {
        url: config.url,
        [config.endpointKey]: config.endpoint,
        reachable: false,
        statusCode: null,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown health check error',
      }
  })

  res.json({ success: true, services })
}))

export default router
