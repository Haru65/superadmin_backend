const secretKey = /(password|secret|token|authorization)/i

export const redactSecrets = (value) => {
  if (Array.isArray(value)) return value.map(redactSecrets)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    secretKey.test(key) ? '********' : redactSecrets(item),
  ]))
}
