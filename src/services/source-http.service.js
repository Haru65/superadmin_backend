import axios from 'axios'
import { env } from '../config/env.js'

const unwrap = (payload) => payload?.data ?? payload

export const sourceError = (error) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data
    return payload?.message || payload?.error || error.code || error.message
  }
  return error instanceof Error ? error.message : 'Unknown source API error'
}

export const createSourceClient = (baseURL, token) => {
  const client = axios.create({ baseURL, timeout: env.SOURCE_API_TIMEOUT_MS })
  client.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  return {
    get: async (path, config) => unwrap((await client.get(path, config)).data),
    post: async (path, body, config) => unwrap((await client.post(path, body, config)).data),
    put: async (path, body, config) => unwrap((await client.put(path, body, config)).data),
    patch: async (path, body, config) => unwrap((await client.patch(path, body, config)).data),
    delete: async (path, config) => unwrap((await client.delete(path, config)).data),
  }
}
