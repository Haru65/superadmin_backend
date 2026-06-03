# LogDine SuperAdmin Scope And Routing

This document describes the intended LogDine platform SuperAdmin scope, the cafe and restaurant routes that are exposed for SuperAdmin usage, the normalized data naming used by `superadmin-backend`, and how `superadmin-backend` calls back into cafe and restaurant systems.

## Platform Scope

LogDine SuperAdmin is the platform-level control plane for the whole LogDine ecosystem. It is not a cafe-only or restaurant-only admin.

The SuperAdmin scope is:

1. Manage all businesses and tenants across cafe, restaurant, and lodging systems.
2. Manage admins and staff users.
3. View platform-wide orders and revenue.
4. Manage subscriptions and expiry.
5. Configure payment gateways.
6. Monitor API and database health.
7. Provide analytics and reports.
8. Authenticate platform-level SuperAdmin users.
9. Aggregate data from cafe, restaurant, and lodging systems.
10. Provide one unified control panel for the whole LogDine platform.

## Architecture

Frontend requests must go only to `superadmin-backend`.

```text
SuperAdmin Frontend
  -> superadmin-backend
    -> cafe backend
    -> restaurant backend
    -> lodging backend, when available
```

The frontend must not call cafe or restaurant APIs directly.

## Backend Roles

| System | Folder | Default port | Base URL from SuperAdmin |
| --- | --- | ---: | --- |
| SuperAdmin backend | `superadmin-backend` | `5000` | N/A |
| Cafe backend | `dineflow_backend` | `5001` | `CAFE_API_URL` |
| Restaurant backend | `restaurant-api` | `5002` | `RESTAURANT_API_URL` |
| Lodging backend | TBD | `5003` when configured | `LODGING_API_URL` |

Recommended same-droplet source URLs:

```env
CAFE_API_URL=http://127.0.0.1:5001
RESTAURANT_API_URL=http://127.0.0.1:5002
LODGING_API_URL=
```

## Trust And Authentication

The SuperAdmin frontend authenticates against `superadmin-backend` only.

`superadmin-backend` authenticates to cafe and restaurant backends as a trusted internal platform service by sending:

```http
X-LogDine-Internal-Token: <LOGDINE_INTERNAL_API_TOKEN>
```

The same `LOGDINE_INTERNAL_API_TOKEN` value must be configured in:

```text
superadmin-backend/.env
dineflow_backend/.env
restaurant-api environment
```

The optional Bearer-token env values can stay empty when the internal token is configured:

```env
CAFE_API_TOKEN=
RESTAURANT_API_TOKEN=
LODGING_API_TOKEN=
```

## SuperAdmin Backend Public Routes

All routes below are mounted by `superadmin-backend`. Except `/health`, `/auth/login`, and `/debug/source-health`, these routes require a SuperAdmin backend Bearer JWT.

| Method | SuperAdmin route | Purpose | Source calls |
| --- | --- | --- | --- |
| `GET` | `/health` | SuperAdmin backend health | none |
| `GET` | `/debug/source-health` | Temporary source connectivity check | cafe tenants, restaurant restaurants, lodging when configured |
| `POST` | `/auth/login` | Login platform SuperAdmin | SuperAdmin DB |
| `GET` | `/auth/me` | Current SuperAdmin user | SuperAdmin DB |
| `GET` | `/superadmin/dashboard` | Aggregated dashboard metrics | tenants, users, orders, subscriptions |
| `GET` | `/superadmin/tenants` | Aggregated tenants/businesses | cafe tenants, restaurant tenants, lodging hotels |
| `GET` | `/superadmin/tenants/:source/:id` | One normalized tenant | cafe or restaurant tenant detail, or aggregate lookup |
| `POST` | `/superadmin/tenants` | Create tenant | cafe or restaurant currently |
| `PUT` | `/superadmin/tenants/:source/:id` | Update tenant | cafe or restaurant currently |
| `PATCH` | `/superadmin/tenants/:source/:id/status` | Pause/resume tenant | cafe or restaurant currently |
| `DELETE` | `/superadmin/tenants/:source/:id` | Delete tenant | cafe or restaurant |
| `GET` | `/superadmin/users` | Aggregated users | cafe users, restaurant users, lodging users |
| `POST` | `/superadmin/users` | Create user | cafe or restaurant |
| `PATCH` | `/superadmin/users/:source/:id` | Update user | cafe or restaurant |
| `DELETE` | `/superadmin/users/:source/:id` | Delete user | cafe or restaurant |
| `POST` | `/superadmin/users/:source/:id/reset-password` | Reset user password | cafe or restaurant |
| `GET` | `/superadmin/orders` | Aggregated orders | cafe orders, restaurant orders, lodging bookings |
| `GET` | `/superadmin/revenue` | Aggregated revenue summary | orders aggregation |
| `GET` | `/superadmin/analytics` | Aggregated analytics | dashboard aggregation |
| `GET` | `/superadmin/subscriptions` | Aggregated subscriptions | cafe subscriptions, restaurant subscriptions, lodging subscriptions |
| `PATCH` | `/superadmin/subscriptions/:source/:id` | Update subscription | restaurant only currently |
| `GET` | `/superadmin/tenants/:source/:tenantId/payment-config` | Payment config | cafe only currently |
| `POST` | `/superadmin/tenants/:source/:tenantId/payment-config` | Save payment config | cafe only currently |
| `POST` | `/superadmin/tenants/:source/:tenantId/payment-config/validate` | Validate payment config | cafe only currently |

## Cafe SuperAdmin Source Routes

Cafe source lives in `dineflow_backend`.

### Current source routes used by `superadmin-backend`

| Method | Cafe route | Used by SuperAdmin route | Notes |
| --- | --- | --- | --- |
| `GET` | `/admin/superadmin/tenants` | `GET /superadmin/tenants`, `/debug/source-health` | Lists cafe tenants |
| `GET` | `/admin/superadmin/tenants/:id` | `GET /superadmin/tenants/cafe/:id` | Tenant details |
| `POST` | `/admin/superadmin/tenants` | `POST /superadmin/tenants` | Create cafe tenant |
| `PUT` | `/admin/superadmin/tenants/:id` | `PUT /superadmin/tenants/cafe/:id` | Update cafe tenant |
| `DELETE` | `/admin/superadmin/tenants/:id` | `DELETE /superadmin/tenants/cafe/:id` | Delete cafe tenant |
| `PATCH` | `/admin/superadmin/tenants/:id/pause` | `PATCH /superadmin/tenants/cafe/:id/status` | Pause cafe tenant |
| `PATCH` | `/admin/superadmin/tenants/:id/resume` | `PATCH /superadmin/tenants/cafe/:id/status` | Resume cafe tenant |
| `GET` | `/admin/superadmin/dashboard/metrics` | Cafe service helper | Source metrics |
| `GET` | `/superadmin/users` | `GET /superadmin/users` | Lists cafe users |
| `POST` | `/superadmin/users` | `POST /superadmin/users` | Create cafe user |
| `PATCH` | `/superadmin/users/:id` | `PATCH /superadmin/users/cafe/:id` | Update cafe user |
| `DELETE` | `/superadmin/users/:id` | `DELETE /superadmin/users/cafe/:id` | Delete cafe user |
| `POST` | `/superadmin/users/:id/reset-password` | Reset cafe user password | Sends `password` |
| `GET` | `/admin/superadmin/tenants/:tenantId/payment-config` | Payment config read | Cafe payment config |
| `POST` | `/admin/superadmin/tenants/:tenantId/payment-config` | Payment config save | Cafe payment config |
| `POST` | `/admin/superadmin/tenants/:tenantId/payment-config/validate` | Payment config validate | Cafe payment validation |

### Additional cafe unified SuperAdmin routes available

`dineflow_backend` also mounts unified routes under `/superadmin`, including:

```text
GET    /superadmin/dashboard
GET    /superadmin/tenants
GET    /superadmin/tenants/:id
POST   /superadmin/tenants
PUT    /superadmin/tenants/:id
DELETE /superadmin/tenants/:id
PATCH  /superadmin/tenants/:id/status
GET    /superadmin/users
POST   /superadmin/users
PATCH  /superadmin/users/:id
DELETE /superadmin/users/:id
POST   /superadmin/users/:id/reset-password
GET    /superadmin/orders
GET    /superadmin/revenue
GET    /superadmin/analytics
GET    /superadmin/subscriptions
PATCH  /superadmin/subscriptions/:id
GET    /superadmin/tenants/:tenantId/payment-config
POST   /superadmin/tenants/:tenantId/payment-config
POST   /superadmin/tenants/:tenantId/payment-config/validate
```

At the moment, `superadmin-backend` uses the legacy cafe `/admin/superadmin/...` tenant/payment endpoints.

## Restaurant SuperAdmin Source Routes

Restaurant source lives in `restaurant-api`.

### Current source routes used by `superadmin-backend`

| Method | Restaurant route | Used by SuperAdmin route | Notes |
| --- | --- | --- | --- |
| `GET` | `/superadmin/tenants` | `GET /superadmin/tenants`, `/debug/source-health` | Lists restaurant businesses |
| `GET` | `/superadmin/tenants/:id` | `GET /superadmin/tenants/restaurant/:id` | Restaurant tenant details |
| `POST` | `/superadmin/tenants` | `POST /superadmin/tenants` | Create restaurant tenant |
| `PUT` | `/superadmin/tenants/:id` | `PUT /superadmin/tenants/restaurant/:id` | Update restaurant tenant |
| `PATCH` | `/superadmin/tenants/:id/status` | `PATCH /superadmin/tenants/restaurant/:id/status` | Pause/resume restaurant tenant |
| `DELETE` | `/superadmin/tenants/:id` | `DELETE /superadmin/tenants/restaurant/:id` | Delete restaurant |
| `GET` | `/superadmin/users` | `GET /superadmin/users` | Restaurant users |
| `POST` | `/superadmin/users` | `POST /superadmin/users` | Create restaurant user |
| `PATCH` | `/superadmin/users/:id` | `PATCH /superadmin/users/restaurant/:id` | Update restaurant user |
| `DELETE` | `/superadmin/users/:id` | `DELETE /superadmin/users/restaurant/:id` | Delete restaurant user |
| `POST` | `/superadmin/users/:id/reset-password` | Reset restaurant user password | Sends `temporaryPassword` |
| `GET` | `/superadmin/orders` | `GET /superadmin/orders`, revenue, dashboard | Restaurant orders |
| `GET` | `/superadmin/subscriptions` | `GET /superadmin/subscriptions` | Restaurant subscriptions |
| `PATCH` | `/superadmin/subscriptions/:id` | `PATCH /superadmin/subscriptions/restaurant/:id` | Update restaurant subscription |
| `GET` | `/superadmin/analytics` | Restaurant service helper | Restaurant analytics |

### Additional restaurant unified SuperAdmin routes available

`restaurant-api/routes/unified-superadmin.mjs` exposes a newer unified contract:

```text
GET    /superadmin/dashboard
GET    /superadmin/analytics
GET    /superadmin/tenants
GET    /superadmin/tenants/:id
POST   /superadmin/tenants
PUT    /superadmin/tenants/:id
DELETE /superadmin/tenants/:id
PATCH  /superadmin/tenants/:id/status
GET    /superadmin/users
POST   /superadmin/users
PATCH  /superadmin/users/:id
DELETE /superadmin/users/:id
POST   /superadmin/users/:id/reset-password
GET    /superadmin/orders
GET    /superadmin/revenue
GET    /superadmin/subscriptions
PATCH  /superadmin/subscriptions/:id
GET    /superadmin/tenants/:tenantId/payment-config
POST   /superadmin/tenants/:tenantId/payment-config
POST   /superadmin/tenants/:tenantId/payment-config/validate
```

At the moment, `superadmin-backend` uses the newer `/superadmin/tenants` restaurant contract for tenant listing, details, creation, updates, status changes, and deletion.

## Source Failure Behavior

Aggregate read routes must not fail the whole request when one source is down.

`superadmin-backend` uses settled source requests and returns partial data:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "sources": {
      "cafe": { "success": true, "error": null },
      "restaurant": { "success": false, "error": "ECONNREFUSED" },
      "lodging": { "success": true, "error": null }
    }
  }
}
```

This applies to:

```text
GET /superadmin/tenants
GET /superadmin/users
GET /superadmin/orders
GET /superadmin/subscriptions
```

Dashboard, revenue, and analytics are built from these aggregate reads.

## Normalized Data Naming

`superadmin-backend` normalizes cafe, restaurant, and lodging source data into one frontend contract. The frontend should depend on these normalized names, not the source-specific names.

### Tenant/business object

```json
{
  "id": "cafe:123",
  "sourceId": "123",
  "source": "cafe",
  "type": "cafe",
  "name": "Business Name",
  "slug": "business-name",
  "status": "active",
  "logoUrl": null,
  "address": null,
  "phone": null,
  "ownerName": null,
  "ownerEmail": null,
  "createdAt": "2026-06-03T00:00:00.000Z",
  "subscription": {
    "plan": "Free",
    "status": "inactive",
    "expiryDate": null
  },
  "payment": {
    "provider": "none",
    "isConfigured": false,
    "isActive": false
  }
}
```

Tenant source field mapping:

| Normalized field | Source fallbacks |
| --- | --- |
| `sourceId` | `sourceId`, `id`, `tenant_id`, `restaurant_id` |
| `name` | `name`, `restaurant_name`, fallback `Unnamed Business` |
| `slug` | `slug`, generated from `name` or `sourceId` |
| `status` | `status`, `is_active`; fallback `active` |
| `logoUrl` | `logoUrl`, `logo_url`, `logo` |
| `address` | `address`, `city` |
| `phone` | `phone`, `contact_phone` |
| `ownerName` | `ownerName`, `owner_name`, `owner` |
| `ownerEmail` | `ownerEmail`, `owner_email`, `contact_email` |
| `createdAt` | `createdAt`, `created_at` |
| `subscription.plan` | `subscription.plan`, `plan`, fallback `Free` |
| `subscription.status` | `subscription.status`, `subscription_status`, fallback `inactive` |
| `subscription.expiryDate` | `subscription.expiryDate`, `subscription.expiry_date`, `expiry_date` |
| `payment.provider` | `payment.provider`, `payment_provider`, fallback `none` |
| `payment.isConfigured` | `payment.isConfigured`, `payment.is_configured`, `payment_configured`, `payment_provider` |
| `payment.isActive` | `payment.isActive`, `payment.is_active`, `payment_active` |

### User object

```json
{
  "id": "restaurant:10",
  "sourceId": "10",
  "source": "restaurant",
  "tenantId": "restaurant:5",
  "tenantName": "Restaurant Name",
  "tenantType": "restaurant",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  "status": "active",
  "passwordResetRequired": false,
  "createdAt": "2026-06-03T00:00:00.000Z"
}
```

User field notes:

| Normalized field | Source fallbacks |
| --- | --- |
| `sourceId` | `sourceId`, `id` |
| `tenantId` | `tenantId`, `tenant_id`, `restaurant_id` |
| `tenantName` | `tenantName`, `tenant_name`, `restaurant_name`, known tenant name |
| `tenantType` | `tenantType`, `tenant_type`, known tenant type, source |
| `role` | `restaurant_admin` becomes `admin`; allowed values are `superadmin`, `admin`, `manager`, `staff`, `receptionist`, `housekeeping` |
| `status` | `status`, `is_active`; normalized to `active` or `inactive` |

### Order object

```json
{
  "id": "restaurant:1001",
  "sourceId": "1001",
  "source": "restaurant",
  "tenantId": "restaurant:5",
  "tenantName": "Restaurant Name",
  "tenantType": "restaurant",
  "amount": 450,
  "paymentStatus": "paid",
  "paymentMethod": "upi",
  "orderType": "dine-in",
  "createdAt": "2026-06-03T00:00:00.000Z"
}
```

Order field notes:

| Normalized field | Source fallbacks |
| --- | --- |
| `sourceId` | `sourceId`, `id`, `order_number` |
| `tenantId` | `tenantId`, `tenant_id`, `restaurant_id` |
| `amount` | `amount`, `total`, `total_amount`, fallback `0` |
| `paymentStatus` | `paymentStatus`, `payment_status`; `completed` becomes `paid` |
| `paymentMethod` | `paymentMethod`, `payment_method`, `payment_provider`; allowed `cash`, `card`, `upi`, `online`, else `unknown` |
| `orderType` | `orderType`, `order_type`, `source_type`; `take-away` becomes `takeaway` |

### Subscription object

```json
{
  "id": "restaurant:55",
  "sourceId": "55",
  "source": "restaurant",
  "tenantId": "restaurant:5",
  "tenantName": "Restaurant Name",
  "tenantType": "restaurant",
  "ownerName": "Owner Name",
  "plan": "Premium",
  "status": "active",
  "startDate": "2026-06-01",
  "expiryDate": "2027-06-01",
  "gracePeriodDays": 0,
  "overdueDays": 0
}
```

Subscription field notes:

| Normalized field | Source fallbacks |
| --- | --- |
| `sourceId` | `sourceId`, `id` |
| `tenantId` | `tenantId`, `tenant_id`, `restaurant_id` |
| `tenantName` | `tenantName`, `tenant_name`, `restaurant_name`, `name`, known tenant name |
| `ownerName` | `ownerName`, `owner_name`, `owner` |
| `plan` | `plan`; normalized to `Free`, `Standard`, `Premium`, or `Enterprise` |
| `status` | `normalizedStatus`, `status`; allowed `active`, `grace`, `suspended`, `inactive`, `expired` |
| `startDate` | `startDate`, `start_date`, `subscription_date` |
| `expiryDate` | `expiryDate`, `expiry_date`, `expiry` |

## Source Identifier Rules

Every normalized record has:

```text
sourceId: original ID from the source system
source: cafe | restaurant | lodging
id: <source>:<sourceId>
```

Examples:

```text
cafe tenant source ID 12       -> id cafe:12
restaurant user source ID 44   -> id restaurant:44
lodging booking source ID 9001 -> id lodging:9001
```

Frontend URLs and update/delete routes should pass both `source` and `sourceId`:

```text
PATCH /superadmin/users/restaurant/44
DELETE /superadmin/tenants/cafe/12
PATCH /superadmin/subscriptions/restaurant/8
```

## Current Implementation Notes

- Cafe tenant, user, order, subscription, and payment configuration operations are implemented where the cafe source exposes them.
- Restaurant user, subscription, and delete-tenant operations are implemented.
- Restaurant tenant creation/update/status operations through `superadmin-backend` are implemented.
- Restaurant payment configuration through `superadmin-backend` is not implemented yet.
- Lodging currently returns safe empty fallback data unless `LODGING_API_URL` is configured.
- `/debug/source-health` is a temporary diagnostic route and should be removed or protected after deployment verification.
