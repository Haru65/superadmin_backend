import { ApiError } from '../utils/ApiError.js'
import { query } from '../config/db.js'

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const getLogoDataUrl = (body = {}) => body.logo ?? body.logoUrl ?? body.logo_url ?? null

export const withLogoAliases = (body = {}, logoDataUrl = getLogoDataUrl(body)) => {
  if (!logoDataUrl) return body
  return {
    ...body,
    logo: body.logo ?? logoDataUrl,
    logoUrl: body.logoUrl ?? logoDataUrl,
    logo_url: body.logo_url ?? logoDataUrl,
  }
}

export const parseLogoDataUrl = (logoDataUrl) => {
  if (!logoDataUrl) return null
  const match = String(logoDataUrl).match(/^data:([^;,]+);base64,([a-z0-9+/=\s]+)$/i)
  if (!match) throw new ApiError(400, 'Logo must be sent as a base64 data URL')

  const mime = match[1].toLowerCase()
  if (!ALLOWED_MIME_TYPES.has(mime)) throw new ApiError(400, 'Logo must be a JPG, PNG, or WebP image')

  const base64 = match[2].replace(/\s/g, '')
  const sizeBytes = Buffer.byteLength(base64, 'base64')
  if (sizeBytes > MAX_LOGO_BYTES) throw new ApiError(400, 'Logo must be 5MB or smaller')

  return { logoDataUrl, mime, sizeBytes }
}

export const saveTenantLogo = async ({ tenant, logoDataUrl, userId }) => {
  const parsed = parseLogoDataUrl(logoDataUrl)
  if (!parsed) return null

  const { rows } = await query(
    `INSERT INTO tenant_logos (
      tenant_id, source, source_id, business_name, logo_data_url, logo_mime, logo_size_bytes, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (source, source_id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      business_name = EXCLUDED.business_name,
      logo_data_url = EXCLUDED.logo_data_url,
      logo_mime = EXCLUDED.logo_mime,
      logo_size_bytes = EXCLUDED.logo_size_bytes,
      created_by = EXCLUDED.created_by,
      updated_at = NOW()
    RETURNING id, tenant_id AS "tenantId", source, source_id AS "sourceId", logo_mime AS "logoMime", logo_size_bytes AS "logoSizeBytes"`,
    [
      tenant.id,
      tenant.source || tenant.type,
      tenant.sourceId,
      tenant.name,
      parsed.logoDataUrl,
      parsed.mime,
      parsed.sizeBytes,
      userId || null,
    ],
  )
  return rows[0]
}
