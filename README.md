# PlayStack — Employee Management System (EMS)

Full-stack hiring assignment: secure auth, RBAC, employee CRUD, org hierarchy, and dashboard.

## Structure

```
/server   → Express + TypeScript + Mongoose API
/client   → React + TypeScript + Tailwind (Vite)
```

## Server setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local) via `MONGO_URI`

### Install & run

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev            # http://localhost:5000
```

## Client setup

```bash
cd client
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

`VITE_API_URL` defaults to `http://localhost:5000/api`.

### Seeded credentials (password for all: `Password123!`)

| Email | Role |
|---|---|
| `admin@ems.test` | Super Admin |
| `hr@ems.test` | HR Manager |
| `employee@ems.test` | Employee |

### Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Email + password → JWT + user |
| `POST` | `/api/auth/logout` | No | Stateless logout ack |
| `GET` | `/api/auth/me` | Bearer JWT | Current user |
| `GET` | `/api/health` | No | Health check |

### Employee endpoints (RBAC)

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Super Admin, HR | List + search/filter/sort/pagination |
| `POST` | `/api/employees` | Super Admin, HR | Create (HR → role `employee` only) |
| `GET` | `/api/employees/:id` | All (Employee: self only) | Get one |
| `PUT` | `/api/employees/:id` | All (Employee: self, phone/profileImage only) | Update |
| `DELETE` | `/api/employees/:id` | Super Admin | Soft delete |
| `GET` | `/api/employees/:id/reportees` | All (Employee: self only) | Direct reports |
| `PATCH` | `/api/employees/:id/manager` | Super Admin, HR | Set manager (cycle-safe) |

### Organization

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/organization/tree` | All | Full tree (Employee: own branch) |

### List query params
`search`, `department`, `role`, `status`, `sortBy` (`joiningDate|name|email|salary|createdAt`), `order` (`asc|desc`), `page`, `limit`

### Example login

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@ems.test\",\"password\":\"Password123!\"}"
```

## Tech stack
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, JWT, bcrypt
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, react-hook-form + zod
- Dev runners: `tsx` (server), Vite (client)

## Notes
- JWT is returned in the login response body. For this assignment, storing it in `localStorage` on the client is acceptable; httpOnly cookies are preferable in production (XSS tradeoff noted here).
- Soft-delete is modeled via `isDeleted` on Employee; default queries exclude deleted docs.
