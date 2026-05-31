import { aggregatorService } from '../services/aggregator.service.js'

export const getDashboard = async (req, res) => res.json({ success: true, data: await aggregatorService.dashboard() })
