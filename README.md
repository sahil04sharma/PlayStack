# PlayStack — Employee Management System (EMS)

Full-stack hiring assignment: secure auth, RBAC, employee CRUD, org hierarchy, and dashboard.

## Structure

```
/server   → Express + TypeScript + Mongoose API
/client   → React + TypeScript + Tailwind (coming next)
```

## Server setup (current phase)

### Prerequisites
- Node.js 18+
- MongoDB running locally (or update `MONGO_URI`)

### Install & run

```bash
cd server
cp .env.example .env   # already created for local dev
npm install
npm run seed           # creates 3 test users
npm run dev            # http://localhost:5000
```

### Seeded credentials (password for all: `Password123!`)

| Email | Role |
|---|---|
| `admin@ems.test` | Super Admin |
| `hr@ems.test` | HR Manager |
| `employee@ems.test` | Employee |

### Auth endpoints (this phase)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Email + password → JWT + user |
| `POST` | `/api/auth/logout` | No | Stateless logout ack |
| `GET` | `/api/auth/me` | Bearer JWT | Current user |
| `GET` | `/api/health` | No | Health check |

### Example login

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@ems.test\",\"password\":\"Password123!\"}"
```

## Tech stack
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, JWT, bcrypt
- Dev runner: `tsx` (watch mode)
- Frontend: React + TypeScript + Tailwind (next)

## Notes
- JWT is returned in the login response body. For this assignment, storing it in `localStorage` on the client is acceptable; httpOnly cookies are preferable in production (XSS tradeoff noted here).
- Soft-delete is modeled via `isDeleted` on Employee; default queries exclude deleted docs.
