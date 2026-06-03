const sourceKey = (source, value) => `${source}:${String(value ?? '')}`
const subscriptionStatuses = ['active', 'grace', 'suspended', 'inactive', 'expired']
const subscriptionStatus = (value) => subscriptionStatuses.includes(String(value).toLowerCase()) ? String(value).toLowerCase() : 'inactive'
const tenantStatus = (value) => {
  const status = String(value ?? 'active').toLowerCase()
  if (['active', 'paused', 'inactive', 'suspended'].includes(status)) return status
  return status === 'false' ? 'inactive' : 'active'
}
const slugify = (value) => String(value || 'unnamed-business').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const normalizeTenant = (row = {}, source) => {
  row = row && typeof row === 'object' ? row : {}
  const sourceId = String(row.sourceId ?? row.id ?? row.tenant_id ?? row.restaurant_id ?? '')
  const name = String(row.name ?? row.restaurant_name ?? 'Unnamed Business')
  const subscription = row.subscription || {}
  const payment = row.payment || {}
  const slug = String(row.slug ?? slugify(name !== 'Unnamed Business' ? name : sourceId || name))
  return {
    id: sourceKey(source, sourceId),
    sourceId,
    source,
    name,
    slug,
    type: source,
    status: tenantStatus(row.status ?? (row.is_active === false || row.is_active === 0 ? 'inactive' : 'active')),
    logoUrl: row.logoUrl ?? row.logo_url ?? row.logo ?? null,
    address: row.address ?? row.city ?? null,
    phone: row.phone ?? row.contact_phone ?? null,
    ownerName: row.ownerName ?? row.owner_name ?? row.owner ?? null,
    ownerEmail: row.ownerEmail ?? row.owner_email ?? row.contact_email ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    subscription: {
      plan: subscription.plan ?? row.plan ?? 'Free',
      status: subscriptionStatus(subscription.status ?? row.subscription_status ?? 'inactive'),
      expiryDate: subscription.expiryDate ?? subscription.expiry_date ?? row.expiry_date ?? null,
    },
    payment: {
      provider: payment.provider ?? row.payment_provider ?? 'none',
      isConfigured: Boolean(payment.isConfigured ?? payment.is_configured ?? row.payment_configured ?? row.payment_provider),
      isActive: Boolean(payment.isActive ?? payment.is_active ?? row.payment_active),
    },
  }
}
