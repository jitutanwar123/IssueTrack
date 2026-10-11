# VIRAJ Ticket Tracking System

A full-stack IT service management (ITSM)-style application for creating, assigning, tracking, and resolving support tickets across user, staff, and admin workflows.

## Features

- Role-based portals and dashboards for administrators, users, and IT staff
- Ticket creation, listing, detail views, updates, assignment, and resolution workflows
- Ticket search, filtering, and pagination
- Ticket comments and status/history tracking
- Dashboard summaries, reports, and data visualizations
- User registration and login flows, with JWT-based authentication
- Password-reset and email-verification OTP flows
- Ticket attachments and PDF/report-related functionality
- Responsive interface with a theme context and reusable React components

> Feature availability depends on the configured environment and database. This README describes the current codebase; it does not imply that every deployment integration is configured.

## Tech stack

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Recharts for data visualizations
- Axios-based API utilities

### Backend
- Node.js (ES modules)
- Express 5
- MySQL using `mysql2`
- JWT (`jsonwebtoken`) and bcrypt for authentication-related functionality
- Multer for handling file uploads
- PDFKit and ExcelJS/XLSX-related reporting utilities
- Email-related integrations using Nodemailer and Resend

## Project structure

```text
.
├── client/
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # Auth, tickets, theme, and toast state
│   │   ├── pages/        # Admin, user, and staff pages
│   │   └── utils/        # API helpers and shared utilities
│   └── package.json
├── server/
│   ├── server.js         # Express API and application setup
│   ├── emailService.js   # Email-related functions
│   ├── utils/            # Server utilities
│   └── package.json
└── package.json          # npm workspaces and root scripts
```

## Prerequisites

- Node.js and npm
- A MySQL database
- The environment variables and database TLS certificate required by your deployment
- Email provider settings if you want email-based features to work

## Local setup

1. Clone the repository and enter the project directory.

   ```bash
   git clone https://github.com/jitutanwar123/IssueTrack.git
   cd IssueTrack
   ```

2. Install dependencies from the repository root.

   ```bash
   npm install
   ```

3. Configure the backend environment for your own setup. The server reads database settings from environment variables including:

   ```env
   DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   DB_PORT=3306
   JWT_SECRET=
   FRONTEND_URL=http://localhost:5173
   ```

   Use real values in your local environment, not in source control. The current server code also expects its MySQL TLS CA certificate at `server/certs/aiven-ca.pem`. Adjust the configuration if your database provider uses a different TLS setup. Configure any email-related environment variables required by `server/emailService.js` before testing email flows.

4. Start the backend API in one terminal.

   ```bash
   npm run dev:server
   ```

5. Start the Vite frontend in a second terminal.

   ```bash
   npm run dev:client
   ```

The root scripts start the server and client separately. The API includes a health endpoint at `/api/health`; the frontend normally runs at Vite's local development URL.

## API overview

The backend provides API routes for application workflows including authentication, tickets, comments, users/team management, dashboards, reports, and staff operations. The exact routes and required permissions are defined in `server/server.js`; check that file for the current implementation before integrating another client.

## Security notes

- Never commit `.env` files, database credentials, JWT secrets, email API keys, or production data.
- Do not rely on frontend role checks alone; protected operations must be authorized by the backend.
- Use unique, strong secrets and configure database TLS appropriately.
- Do not assume demo accounts exist unless they are explicitly configured in your own environment.

## Development

Useful root commands:

```bash
npm run dev:server
npm run dev:client
npm run build
npm start
```

`npm run build` builds the client. `npm start` starts the backend server. Review each workspace's `package.json` for additional scripts.

## Project purpose

This project demonstrates a full-stack ticket-management workflow and the integration of a React user interface with a Node.js/Express API and MySQL database. It can be extended with additional validation, automated tests, monitoring, and deployment-specific configuration.
