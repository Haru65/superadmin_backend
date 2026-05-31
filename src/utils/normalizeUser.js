export const normalizeUser = (row = {}, source, tenants = []) => {
  const sourceId = String(row.sourceId ?? row.id ?? '')
  const rawTenantId = String(row.tenantId ?? row.tenant_id ?? row.restaurant_id ?? '')
  const tenant = tenants.find((item) => item.source === source && item.sourceId === rawTenantId)
  const rawRole = String(row.role ?? 'staff').toLowerCase()
  const role = rawRole === 'restaurant_admin' ? 'admin' : ['superadmin', 'admin', 'manager', 'staff', 'receptionist', 'housekeeping'].includes(rawRole) ? rawRole : 'staff'
  return {
    id: `${source}:${sourceId}`,
    sourceId,
    source,
    tenantId: tenant?.id ?? (rawTenantId ? `${source}:${rawTenantId}` : ''),
    tenantName: row.tenantName ?? row.tenant_name ?? row.restaurant_name ?? tenant?.name ?? '',
    tenantType: row.tenantType ?? row.tenant_type ?? tenant?.type ?? source,
    name: String(row.name ?? 'Unnamed User'),
    email: String(row.email ?? ''),
    role,
    status: String(row.status ?? (row.is_active === false || row.is_active === 0 ? 'inactive' : 'active')).toLowerCase() === 'active' ? 'active' : 'inactive',
    passwordResetRequired: Boolean(row.passwordResetRequired ?? row.password_reset_required ?? row.must_change_password),
    createdAt: row.createdAt ?? row.created_at ?? null,
  }
}
