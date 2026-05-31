export const normalizeSubscription = (row = {}, source, tenants = []) => {
  const sourceId = String(row.sourceId ?? row.id ?? '')
  const rawTenantId = String(row.tenantId ?? row.tenant_id ?? row.restaurant_id ?? '')
  const tenant = tenants.find((item) => item.source === source && item.sourceId === rawTenantId)
  const rawPlan = String(row.plan ?? 'Free').toLowerCase()
  const plan = ({ free: 'Free', standard: 'Standard', premium: 'Premium', enterprise: 'Enterprise' })[rawPlan] ?? 'Free'
  const rawStatus = String(row.normalizedStatus ?? row.status ?? 'inactive').toLowerCase()
  const status = ['active', 'grace', 'suspended', 'inactive', 'expired'].includes(rawStatus) ? rawStatus : 'inactive'
  return {
    id: `${source}:${sourceId}`,
    sourceId,
    source,
    tenantId: tenant?.id ?? (rawTenantId ? `${source}:${rawTenantId}` : ''),
    tenantName: row.tenantName ?? row.tenant_name ?? row.restaurant_name ?? row.name ?? tenant?.name ?? 'Unnamed Business',
    tenantType: source,
    ownerName: row.ownerName ?? row.owner_name ?? row.owner ?? '',
    plan,
    status,
    startDate: row.startDate ?? row.start_date ?? row.subscription_date ?? null,
    expiryDate: row.expiryDate ?? row.expiry_date ?? row.expiry ?? null,
    gracePeriodDays: Number(row.gracePeriodDays ?? row.grace_period_days ?? 0),
    overdueDays: Number(row.overdueDays ?? row.overdue_days ?? 0),
  }
}
