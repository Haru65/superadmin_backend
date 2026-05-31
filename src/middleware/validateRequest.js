import { ApiError } from '../utils/ApiError.js'

export const validateRequest = (schema, property = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[property])
  if (!parsed.success) return next(new ApiError(400, 'Validation failed', parsed.error.flatten()))
  if (property === 'query') req.validatedQuery = parsed.data
  else req[property] = parsed.data
  next()
}
