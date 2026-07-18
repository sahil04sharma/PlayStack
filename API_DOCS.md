# PlayStack EMS — API Documentation

Base URL (local): `http://localhost:5000/api`

All protected routes require:

```http
Authorization: Bearer <JWT>
```

JWT is issued on login and expires in **1 day**.

---

## Roles

| Role key | Label |
|---|---|
| `super_admin` | Super Admin |
| `hr_manager` | HR Manager |
| `employee` | Employee |

---

## Auth

### `POST /auth/login`

| | |
|---|---|
| **Auth** | None |
| **Roles** | — |

**Request body**

```json
{
  "email": "admin@ems.test",
  "password": "Password123!"
}
```

**Success `200`**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "<mongoObjectId>",
    "name": "Alex Super",
    "email": "admin@ems.test",
    "role": "super_admin"
  }
}
```

**Errors**

| Status | When |
|---|---|
| `400` | Missing/invalid email or password (validation) |
| `401` | Invalid credentials |

---

### `POST /auth/logout`

| | |
|---|---|
| **Auth** | None (stateless) |
| **Roles** | — |

**Success `200`**

```json
{ "message": "Logged out" }
```

Client should discard the stored JWT.

---

### `GET /auth/me`

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | Any authenticated |

**Success `200`**

```json
{
  "id": "<mongoObjectId>",
  "name": "Alex Super",
  "email": "admin@ems.test",
  "role": "super_admin"
}
```

**Errors:** `401` if token missing/invalid/expired, or user inactive.

---

## Health

### `GET /health`

| | |
|---|---|
| **Auth** | None |

**Success `200`**

```json
{ "status": "ok" }
```

Mounted at `/api/health`.

---

## Employees

### `GET /employees`

List employees with search, filter, sort, and pagination.

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin`, `hr_manager` |

**Query params**

| Param | Type | Default | Notes |
|---|---|---|---|
| `search` | string | — | Case-insensitive match on name or email |
| `department` | string | — | Exact department |
| `role` | string | — | `super_admin` \| `hr_manager` \| `employee` |
| `status` | string | — | `active` \| `inactive` |
| `sortBy` | string | `joiningDate` | `joiningDate`, `name`, `email`, `salary`, `createdAt` |
| `order` | string | `desc` | `asc` \| `desc` |
| `page` | number | `1` | ≥ 1 |
| `limit` | number | `10` | 1–100 |

**Success `200`**

```json
{
  "data": [
    {
      "_id": "...",
      "employeeId": "EMP-0001",
      "name": "Alex Super",
      "email": "admin@ems.test",
      "phone": "9999999999",
      "role": "super_admin",
      "department": "Executive",
      "designation": "CEO",
      "salary": 200000,
      "joiningDate": "2020-01-01T00:00:00.000Z",
      "status": "active",
      "reportingManager": null,
      "profileImage": "",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

`reportingManager` may be populated as `{ _id, name, email, employeeId }`.

**Errors:** `401`, `403`, `400` (invalid query).

---

### `POST /employees`

Create an employee.

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin`, `hr_manager` |

**Request body**

```json
{
  "name": "Jordan Lee",
  "email": "jordan.lee@ems.test",
  "phone": "9123456789",
  "password": "Password123!",
  "department": "Engineering",
  "designation": "Developer",
  "salary": 70000,
  "joiningDate": "2024-01-15",
  "status": "active",
  "role": "employee",
  "reportingManager": "<managerObjectId>|null",
  "profileImage": ""
}
```

**RBAC notes**

- HR can only create with role `employee` (or omit `role`).
- Super Admin may assign `employee`, `hr_manager`, or `super_admin`.
- `employeeId` is auto-generated (`EMP-XXXX`).
- `passwordHash` is never returned.

**Success `201`** — created employee object (no password).

**Errors:** `400` validation, `403` role restriction, `409` email in use, `404` manager not found.

---

### `POST /employees/import`

Bulk create employees from a CSV file.

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin`, `hr_manager` |
| **Content-Type** | `multipart/form-data` |

**Form field:** `file` — CSV upload

**CSV columns:** `name,email,phone,password,department,designation,salary,joiningDate,status,role`

HR rows with non-`employee` roles are rejected. Default password if omitted: `Password123!`.

**Success `200`**

```json
{
  "message": "CSV import finished",
  "created": 2,
  "failed": 0,
  "createdEmails": ["casey.import@ems.test"],
  "errors": []
}
```

Sample: `server/samples/employees-import.csv`.

---

### `GET /employees/:id`

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | All authenticated |

**RBAC notes**

- `employee` may only fetch their own `:id`.
- Super Admin / HR may fetch any.

**Success `200`** — employee object.

**Errors:** `401`, `403`, `404`.

---

### `PUT /employees/:id`

Update an employee.

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | All authenticated (field-restricted for Employee) |

**Request body** (partial allowed)

```json
{
  "name": "Updated Name",
  "email": "updated@ems.test",
  "phone": "9000011111",
  "password": "OptionalNewPass1",
  "department": "Engineering",
  "designation": "Senior Dev",
  "salary": 80000,
  "joiningDate": "2023-06-15",
  "status": "active",
  "role": "employee",
  "reportingManager": "<id>|null",
  "profileImage": "https://..."
}
```

**RBAC / field rules**

| Actor | Allowed |
|---|---|
| `employee` | Own profile only; fields stripped to `phone`, `profileImage` |
| `hr_manager` | Full update except assigning roles (`role` ignored) |
| `super_admin` | Full update including roles |

If `reportingManager` is set, circular reporting is rejected with `400`.

**Success `200`** — updated employee.

**Errors:** `400`, `403`, `404`, `409`.

---

### `DELETE /employees/:id`

Soft delete (`isDeleted: true`, status → `inactive`).

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin` only |

**Success `200`**

```json
{
  "message": "Employee soft-deleted",
  "id": "<mongoObjectId>"
}
```

**Errors:** `400` (cannot delete self), `403`, `404`.

---

### `GET /employees/:id/reportees`

Direct reports only (one level).

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | All authenticated |

**RBAC notes:** `employee` may only request their own `:id`.

**Success `200`** — array of employees.

---

### `PATCH /employees/:id/manager`

Assign or clear reporting manager (cycle-safe).

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin`, `hr_manager` |

**Request body**

```json
{
  "managerId": "<mongoObjectId>|null"
}
```

**Success `200`** — updated employee (manager populated when set).

**Errors**

| Status | When |
|---|---|
| `400` | Would create circular reporting / self as manager |
| `404` | Employee or manager not found |
| `403` | Insufficient role |

---

## Organization

### `GET /organization/tree`

Nested org chart built in-memory from a single employee query.

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin`, `hr_manager`, `employee` |

**RBAC notes**

- Super Admin / HR: full tree (roots = no manager).
- Employee: own branch only (subtree rooted at self).

**Success `200`**

```json
[
  {
    "_id": "...",
    "employeeId": "EMP-0001",
    "name": "Alex Super",
    "role": "super_admin",
    "department": "Executive",
    "directReports": [
      {
        "_id": "...",
        "name": "Priya HR",
        "directReports": []
      }
    ]
  }
]
```

Each node includes standard employee DTO fields plus `directReports: OrgTreeNode[]`.

---

## Dashboard

### `GET /dashboard/stats`

Workforce KPIs for managers.

| | |
|---|---|
| **Auth** | Bearer JWT |
| **Roles** | `super_admin`, `hr_manager` |

**Success `200`**

```json
{
  "totalEmployees": 25,
  "activeEmployees": 22,
  "inactiveEmployees": 3,
  "departmentCount": 6,
  "departmentBreakdown": [
    { "_id": "Engineering", "count": 8 },
    { "_id": "Sales", "count": 5 }
  ]
}
```

Soft-deleted employees are excluded.

**Errors:** `401`, `403`.

---

## Validation

Employee create/update and login use **express-validator**. Failures return:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone must be 10 digits" }
  ]
}
```

Common rules:

| Field | Rule |
|---|---|
| `email` | Valid email |
| `phone` | Exactly 10 digits |
| `password` | Min 8 chars (required on create) |
| `salary` | Number ≥ 0 |
| `joiningDate` | ISO-8601 date |
| `status` | `active` \| `inactive` |
| `role` | `super_admin` \| `hr_manager` \| `employee` |

---

## Common error shapes

```json
{ "message": "No token provided" }
```

```json
{ "message": "Forbidden: insufficient role" }
```

```json
{ "message": "This would create a circular reporting chain" }
```

---

## Seeded demo users

Password for all: `Password123!`

| Email | Role |
|---|---|
| `admin@ems.test` | Super Admin |
| `hr@ems.test` | HR Manager |
| `employee@ems.test` | Employee |

Run: `cd server && npm run seed`
