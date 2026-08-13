# Employee Management System - React

React/Vite conversion of the Angular EMS frontend. The existing Spring Boot backend is reused without API changes.

## Stack
- React 19 + Vite
- React Router
- Axios with JWT interceptor
- Tailwind CSS 4
- Bootstrap Icons
- SweetAlert2

## Run
```bash
npm install
npm run dev
```
Local API: `http://localhost:8080/api`
Production API: `https://employee-management-backend-spring-boot-1.onrender.com/api`

## Included modules
Login, Forgot Password/OTP, role-protected routing, Dashboard, Employees CRUD/login management/import, Attendance, Leaves, Salary/Payslip/PDF, AI Payroll Explainer, Holidays, Roles, Settings, Employee Profile, EMS AI Chat, Admin AI Daily Brief, AI performance summary, global loader.

## Deployment
Build with `npm run build`. For Vercel SPA routing, `vercel.json` is included.
