Employee Management System – Full Stack Developer Hiring Assignment
Role: Full Stack Developer
Assignment Duration: 8–10 Hours


Objective
Build an Employee Management System (EMS) with secure authentication, role-based access control, employee management, organizational hierarchy, and a responsive dashboard.
Tech Stack
Frontend: React.js/Next.js, TypeScript, Tailwind/Material UI
Backend: Node.js + Express.js
Database: MongoDB or PostgreSQL
Authentication: JWT + bcrypt
Authentication
Login
Logout
Protected Routes
Password hashing
Role-Based Access Control
Roles: Super Admin, HR Manager, Employee
Super Admin: Full access, assign roles/managers, CRUD
HR: Create/Edit/View employees, cannot delete or assign Super Admin
Employee: View/edit own profile only (limited fields)
Dashboard
Total Employees
Active Employees
Inactive Employees
Department Count
Employee Management
CRUD operations
Fields: Employee ID, Name, Email, Phone, Department, Designation, Salary, Joining Date, Status, Role, Reporting Manager, Profile Image
Organizational Hierarchy
Assign reporting manager
Display reporting tree
Prevent circular reporting
Show direct reports
Search, Filter & Sorting
Search by name/email
Filter by department, role, status
Sort by joining date and name
Validation
Frontend & backend validation
Email, phone, salary, required fields
API Endpoints
POST /api/auth/login
POST /api/auth/logout
GET/POST/PUT/DELETE /api/employees
GET /api/organization/tree
GET /api/employees/:id/reportees
PATCH /api/employees/:id/manager
Bonus Features
Pagination
Soft Delete
CSV Import
Dashboard Charts
Dark Mode
Docker
Unit Tests
Deployment
Evaluation Criteria
Frontend UI & UX – 20%
Backend APIs – 20%
RBAC – 15%
Organizational Hierarchy – 15%
CRUD – 15%
Database – 5%
Validation – 5%
Code Quality & Docs – 5%
Submission Requirements
GitHub Repository
README
API Documentation
Screenshots/Demo
Live Deployment (Bonus)
