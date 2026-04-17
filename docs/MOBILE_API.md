# Clickinder Mobile API Documentation

**Base URL:** `https://clickynder.com/api/mobile`

**Version:** 2.0 (April 2026)

---

## Authentication

All mobile endpoints (except login and Google auth) require a JWT Bearer token.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Auth Endpoints

#### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "cuid",
    "name": "שם",
    "email": "user@example.com",
    "phone": "0501234567"
  }
}
```

#### POST /auth/google

Login/register with Google OAuth token.

**Request:**
```json
{
  "idToken": "google_id_token"
}
```

#### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:**
```json
{
  "accessToken": "new_eyJ...",
  "refreshToken": "new_eyJ..."
}
```

---

## Business

#### GET /businesses/:id

Get business details.

**Response includes:**
- `id`, `name`, `slug`, `description`, `address`, `phone`, `email`
- `timezone`, `locale`, `currency`
- `logoUrl`, `templateStyle`, `primaryColor`, `secondaryColor`
- `showBranches`, `showStaff`, `onlinePaymentEnabled`
- `paymentProvider`, `paymeApiKey` (for client-side hosted fields)
- `depositEnabled`, `depositAmountCents`, `depositPercentage`, `requirePaymentForBooking`
- `cancellationPolicyEnabled`, `cancellationDeadlineHours`
- Social links

#### GET /businesses/hours

Get business working hours.

**Query:** `businessId`

---

## Branches

#### GET /branches

List branches for the authenticated user's business.

**Query:** `?active=true`

#### GET /branches/:id

Get branch details.

---

## Staff

#### GET /staff

List staff members.

**Query:** `?active=true&branchId=xxx`

**Response includes:** `commissionPercentage` field (new).

#### GET /staff/:id

Get staff details with service associations.

---

## Services

#### GET /services

List all active services.

**Response includes new fields:**
```json
{
  "id": "...",
  "name": "פילאטיס",
  "isGroup": true,
  "maxParticipants": 15,
  "minParticipants": 3,
  "waitlistEnabled": true,
  "requirePayment": true,
  "depositOverrideCents": 5000,
  "durationMin": 60,
  "priceCents": 8000
}
```

#### GET /services/:id

Get single service with staff associations and intake forms.

---

## Appointments

#### GET /appointments

List appointments.

**Query:** `?from=2026-04-01&to=2026-04-30&status=confirmed&staffId=xxx`

**Response includes new fields:**
- `groupSessionId` - if part of a group session
- `recurringSeriesId` - if part of a recurring series
- `depositAmountCents` - deposit amount paid
- `paymeSaleId` - PayMe sale reference

#### GET /appointments/:id

Get appointment details with customer, service, staff, branch.

#### POST /appointments/book

Book a new appointment.

**Request (standard):**
```json
{
  "businessId": "...",
  "branchId": "...",
  "serviceId": "...",
  "staffId": "...",
  "date": "2026-04-15",
  "time": "10:00",
  "customerName": "ישראל ישראלי",
  "customerPhone": "0501234567",
  "customerEmail": "email@test.com",
  "notes": "הערות"
}
```

**Request (group session):**
```json
{
  "businessId": "...",
  "serviceId": "...",
  "groupSessionId": "group_session_cuid",
  "customerName": "ישראל ישראלי",
  "customerPhone": "0501234567"
}
```

**Response:**
```json
{
  "success": true,
  "confirmationCode": "ABC123",
  "appointmentId": "cuid"
}
```

#### PUT /appointments/:id

Update appointment status or notes.

**Request:**
```json
{
  "status": "canceled",
  "notesInternal": "הערה פנימית"
}
```

**Response includes:** `cancellationFee` (in agorot) if cancellation policy applies.

#### GET /appointments/slots

Get available time slots.

**Query:** `serviceId`, `date`, `staffId?`, `branchId?`

**Response (regular service):**
```json
{
  "slots": ["08:00", "08:30", "09:00"],
  "isGroup": false,
  "waitlistEnabled": false
}
```

**Response (group service):**
```json
{
  "slots": [],
  "isGroup": true,
  "groupSessions": [
    {
      "id": "gs_cuid",
      "startAt": "2026-04-15T08:00:00.000Z",
      "endAt": "2026-04-15T09:00:00.000Z",
      "time": "08:00",
      "maxParticipants": 15,
      "currentCount": 8,
      "availableSpots": 7,
      "staff": { "id": "...", "name": "מדריכה" },
      "branch": null,
      "notes": "סשן בוקר"
    }
  ]
}
```

---

## Group Sessions (NEW)

#### GET /group-sessions

List group sessions.

**Query:** `?serviceId=xxx&status=open&from=2026-04-01&to=2026-04-30`

#### GET /group-sessions/:id

Get session with participants list.

#### POST /group-sessions

Create a new group session (admin).

**Request:**
```json
{
  "serviceId": "...",
  "staffId": "...",
  "branchId": "...",
  "startAt": "2026-04-15T08:00:00.000Z",
  "maxParticipants": 15,
  "notes": "סשן בוקר"
}
```

#### PUT /group-sessions/:id

Update group session.

#### DELETE /group-sessions/:id

Cancel session and all associated appointments.

---

## Waitlist (NEW)

#### GET /waitlist

List waitlist entries.

**Query:** `?serviceId=xxx&status=waiting`

#### POST /waitlist

Add customer to waitlist.

**Request:**
```json
{
  "serviceId": "...",
  "customerId": "...",
  "staffId": "...",
  "preferredDate": "2026-04-15",
  "preferredTimeRange": "08:00-12:00"
}
```

**Response:**
```json
{
  "entry": {
    "id": "...",
    "position": 3,
    "status": "waiting",
    "customer": { ... },
    "service": { ... }
  }
}
```

### Waitlist Status Values
- `waiting` - In queue
- `offered` - Slot offered, waiting for response
- `booked` - Converted to appointment
- `expired` - Offer expired
- `canceled` - Removed from waitlist

---

## Payments (NEW - Quick Payments / PayMe)

#### POST /payments

Generate a payment sale.

**Request:**
```json
{
  "appointmentId": "...",
  "buyerKey": "token_from_payme_hosted_fields"
}
```

**Response:**
```json
{
  "success": true,
  "saleUrl": "https://live.payme.io/...",
  "paymeSaleId": "..."
}
```

#### GET /payments/:appointmentId

Get payment status for an appointment.

**Response:**
```json
{
  "payments": [
    {
      "id": "...",
      "provider": "quickpayments",
      "amountCents": 5000,
      "currency": "ILS",
      "status": "captured",
      "paymeSaleId": "...",
      "createdAt": "..."
    }
  ],
  "appointmentPaymentStatus": "paid",
  "depositAmountCents": 5000
}
```

### Payment Status Values (on Appointment)
- `not_required` - No payment needed
- `pending` - Payment initiated, awaiting completion
- `paid` - Payment captured
- `refunded` - Payment refunded

### Payment Record Status Values
- `initiated` - Sale created
- `authorized` - Card authorized
- `captured` - Payment completed
- `failed` - Payment failed
- `refunded` - Payment refunded

---

## Recurring Series (NEW)

#### GET /recurring

List all recurring appointment series.

**Response:**
```json
{
  "series": [
    {
      "id": "...",
      "recurrenceRule": "FREQ=WEEKLY;INTERVAL=1;COUNT=10",
      "status": "active",
      "startDate": "2026-04-15",
      "appointments": [ ... ]
    }
  ]
}
```

### Recurring Status Values
- `active` - Series is running
- `paused` - Temporarily stopped
- `completed` - All appointments done
- `canceled` - Series canceled

---

## Customers

#### GET /customers

List customers.

**Query:** `?search=ישראל&page=1&limit=20`

#### GET /customers/:id

Get customer details with appointment history.

#### POST /customers

Create a new customer.

**Request:**
```json
{
  "firstName": "ישראל",
  "lastName": "ישראלי",
  "phone": "0501234567",
  "email": "israel@test.com",
  "notes": "הערות"
}
```

#### PUT /customers/:id

Update customer details.

---

## Dashboard

#### GET /dashboard

Get dashboard overview stats.

**Response:**
```json
{
  "todayAppointments": 8,
  "weekAppointments": 32,
  "monthAppointments": 128,
  "totalCustomers": 250,
  "todayRevenue": 150000,
  "upcomingAppointments": [ ... ]
}
```

---

## Notifications

#### GET /notifications

Get dashboard notifications.

**Query:** `?read=false&limit=20`

#### POST /notifications/mark-read

Mark notifications as read.

**Request:**
```json
{
  "notificationIds": ["id1", "id2"]
}
```

---

## Profile

#### GET /profile

Get current user profile.

#### PUT /profile

Update profile (name, phone).

---

## Push Tokens

#### POST /push-token

Register push notification token.

**Request:**
```json
{
  "token": "ExponentPushToken[xxx]",
  "platform": "ios",
  "deviceName": "iPhone 15"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message in Hebrew or English"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid fields) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (no access to resource) |
| 404 | Not Found |
| 409 | Conflict (slot taken, session full) |
| 500 | Internal Server Error |

---

## Changelog (v2.0)

### New Endpoints
- `GET/POST /group-sessions` - Group session management
- `GET/PUT/DELETE /group-sessions/:id`
- `GET/POST /waitlist` - Waitlist system
- `POST /payments` - Payment processing (Quick Payments / PayMe)
- `GET /payments/:appointmentId` - Payment status
- `GET /recurring` - Recurring appointment series

### Modified Endpoints
- `GET /appointments/slots` - Now returns `groupSessions` array for group services
- `POST /appointments/book` - Now accepts `groupSessionId` for group bookings
- `PUT /appointments/:id` - Now returns `cancellationFee` when cancellation policy applies
- `GET /services` - New fields: `isGroup`, `maxParticipants`, `minParticipants`, `waitlistEnabled`, `requirePayment`, `depositOverrideCents`
- `GET /appointments` - New fields: `groupSessionId`, `recurringSeriesId`, `depositAmountCents`, `paymeSaleId`
- `GET /staff` - New field: `commissionPercentage`
- `GET /businesses/:id` - New fields: payment settings, cancellation policy settings

### New Data Models
- **GroupSession** - Group class/session with capacity
- **WaitlistEntry** - Queue for fully-booked services
- **RecurringSeries** - Recurring appointment series
- **Coupon** - Discount codes
- **Resource** - Business resources (rooms, equipment)

### Payment Integration
- Provider: Quick Payments (PayMe)
- Integration: Hosted Fields (JSAPI) for client-side card input
- Flow: tokenize on client -> `buyer_key` -> server `generate-sale` -> PayMe
- Supports: full payment, deposits, refunds
- Webhook: `/api/payments/webhook` (IPN callback from PayMe)
