export const normalizeOrder = (row = {}, source, tenants = []) => {
  const sourceId = String(row.sourceId ?? row.id ?? row.order_number ?? '')
  const rawTenantId = String(row.tenantId ?? row.tenant_id ?? row.restaurant_id ?? '')
  const tenant = tenants.find((item) => item.source === source && item.sourceId === rawTenantId)
  const rawPayment = String(row.paymentStatus ?? row.payment_status ?? 'pending').toLowerCase()
  const paymentStatus = rawPayment === 'completed' ? 'paid' : ['paid', 'unpaid', 'pending', 'failed'].includes(rawPayment) ? rawPayment : 'pending'
  const rawType = String(row.orderType ?? row.order_type ?? row.source_type ?? (source === 'lodging' ? 'room-booking' : 'dine-in')).toLowerCase()
  const rawMethod = String(row.paymentMethod ?? row.payment_method ?? row.payment_provider ?? 'unknown').toLowerCase()
  const paymentMethod = ['cash', 'card', 'upi', 'online'].includes(rawMethod) ? rawMethod : 'unknown'
  const normalizedType = rawType === 'take-away' ? 'takeaway' : rawType
  const orderType = ['dine-in', 'takeaway', 'delivery', 'room-booking', 'food-order', 'service-request'].includes(normalizedType) ? normalizedType : source === 'lodging' ? 'room-booking' : 'dine-in'
  return {
    id: `${source}:${sourceId}`,
    sourceId,
    source,
    tenantId: tenant?.id ?? (rawTenantId ? `${source}:${rawTenantId}` : ''),
    tenantName: row.tenantName ?? row.tenant_name ?? row.restaurant_name ?? tenant?.name ?? 'Unnamed Business',
    tenantType: source,
    amount: Number(row.amount ?? row.total ?? row.total_amount ?? 0),
    paymentStatus,
    paymentMethod,
    orderType,
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
  }
}
