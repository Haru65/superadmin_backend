const masked = (value) => value ? '********' : null

export const normalizePaymentConfig = (row = {}, source, tenant = {}) => ({
  id: row.id ? String(row.id) : null,
  tenantId: tenant.id ?? `${source}:${String(row.tenantId ?? row.tenant_id ?? '')}`,
  tenantName: tenant.name ?? row.tenantName ?? row.tenant_name ?? '',
  source,
  provider: ['paytm', 'razorpay', 'upi'].includes(String(row.provider).toLowerCase()) ? String(row.provider).toLowerCase() : 'none',
  keyId: row.keyId ?? row.key_id ?? '',
  keySecretMasked: row.keySecretMasked ?? row.key_secret_masked ?? masked(row.keySecret ?? row.key_secret),
  webhookSecretMasked: row.webhookSecretMasked ?? row.webhook_secret_masked ?? masked(row.webhookSecret ?? row.webhook_secret),
  website: row.website ?? '',
  isActive: Boolean(row.isActive ?? row.is_active),
  isConfigured: Boolean(row.isConfigured ?? row.is_configured ?? row.provider),
  createdAt: row.createdAt ?? row.created_at ?? null,
})
