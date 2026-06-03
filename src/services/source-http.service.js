import axios from 'axios'
import { env } from '../config/env.js'

const unwrap = (payload) => payload?.data ?? payload
const upper = (value) => String(value || '').toUpperCase()
const responseData = (response) => {
  const contentType = String(response.headers['content-type'] || '').toLowerCase()
  if (contentType.includes('text/html')) {
    throw new Error(`Source API returned HTML for ${response.config.url}. Check the source API base URL.`)
  }
  return unwrap(response.data)
}

export const sourceError = (error) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data
    const payloadMessage = typeof payload === 'string'
      ? payload.slice(0, 200)
      : payload?.message || payload?.error
    const message = payloadMessage || error.response?.statusText || error.code || error.message
    return error.response?.status ? `HTTP ${error.response.status}: ${message}` : message
  }
  return error instanceof Error ? error.message : 'Unknown source API error'
}

export const createSourceClient = (baseURL, options = {}) => {
  let currentToken = options.token || ''
  let loginPromise
  const auth = options.auth
  const name = options.name || 'source'
  const internalToken = options.internalToken || ''
  const client = axios.create({ baseURL, timeout: env.SOURCE_API_TIMEOUT_MS })
  client.interceptors.request.use((config) => {
    if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`
    if (internalToken) config.headers['X-LogDine-Internal-Token'] = internalToken
    return config
  })
  const authenticate = async () => {
    if (!auth?.email || !auth?.password) return
    if (!loginPromise) {
      loginPromise = client.post(auth.path, auth.body(auth.email, auth.password))
        .then(responseData)
        .then((payload) => {
          const token = payload?.token
          if (!token) throw new Error(`Source API login at ${auth.path} did not return a token`)
          currentToken = token
        })
        .finally(() => { loginPromise = null })
    }
    await loginPromise
  }
  const request = async (method, path, body, config = {}, retry = true) => {
    if (!currentToken) await authenticate()
    try {
      const response = await client.request({ ...config, method, url: path, data: body })
      console.log(`[SOURCE:${name}] ${upper(method)} ${path} -> ${response.status}`)
      return responseData(response)
    } catch (error) {
      console.error(`[SOURCE:${name}] ${upper(method)} ${path} failed: ${sourceError(error)}`)
      if (retry && auth?.email && auth?.password && [401, 403].includes(error.response?.status)) {
        currentToken = ''
        await authenticate()
        return request(method, path, body, config, false)
      }
      throw error
    }
  }
  const probe = async (path) => {
    try {
      if (!currentToken) await authenticate()
      const response = await client.get(path, { validateStatus: () => true })
      console.log(`[SOURCE:${name}] HEALTH ${path} -> ${response.status}`)
      const contentType = String(response.headers['content-type'] || '').toLowerCase()
      if (contentType.includes('text/html')) {
        return { reachable: false, statusCode: response.status, error: 'Source API returned HTML. Check the source API base URL.' }
      }
      const payload = responseData(response)
      const error = typeof payload === 'string'
        ? payload.slice(0, 200)
        : payload?.message || payload?.error || `HTTP ${response.status}`
      return { reachable: response.status >= 200 && response.status < 500, statusCode: response.status, error: response.status >= 400 ? error : null }
    } catch (error) {
      console.error(`[SOURCE:${name}] HEALTH ${path} failed: ${sourceError(error)}`)
      return { reachable: false, statusCode: error.response?.status ?? null, error: sourceError(error) }
    }
  }
  return {
    get: (path, config) => request('get', path, undefined, config),
    post: (path, body, config) => request('post', path, body, config),
    put: (path, body, config) => request('put', path, body, config),
    patch: (path, body, config) => request('patch', path, body, config),
    delete: (path, config) => request('delete', path, undefined, config),
    probe,
  }
}
